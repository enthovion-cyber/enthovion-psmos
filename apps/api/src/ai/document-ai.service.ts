import { BadRequestException, ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../database/supabase.service';
import { AiAuditService } from './ai-audit.service';
import { AiScope } from './ai.types';
import { isRecordInScope } from './ai-scope';
import { LlmGatewayService } from './llm-gateway.service';
import { guardUntrustedText } from './prompt-guard';

export type IngestDocumentInput = {
  recordType: string;
  recordId: string;
  title: string;
  content: string;
  revision?: string | undefined;
  siteId?: string | null | undefined;
};

export type DocumentChunkMatch = {
  id: string;
  recordType: string;
  recordId: string;
  revision: string | null;
  page: number | null;
  content: string;
  score?: number | undefined;
};

export type DocumentComparisonResult = {
  summary: string;
  discrepancies: Array<{
    field: string;
    docAValue: string;
    docBValue: string;
    significance: 'CRITICAL_SAFETY' | 'MODERATE' | 'MINOR';
  }>;
  unresolvedQuestions: string[];
};

@Injectable()
export class DocumentAiService {
  private readonly logger = new Logger(DocumentAiService.name);

  constructor(
    private readonly db: SupabaseService,
    private readonly llm: LlmGatewayService,
    private readonly audit: AiAuditService
  ) {}

  /**
   * Chunks and indexes document text with optional OpenAI vector embeddings into AiKnowledgeChunk.
   * Enforces strict server-side IDOR check to verify that recordId belongs to the caller's tenant.
   */
  async ingestDocument(scope: AiScope, input: IngestDocumentInput) {
    const MAX_CONTENT_BYTES = 5 * 1024 * 1024; // 5 MB maximum payload
    if (!input.content || Buffer.byteLength(input.content, 'utf8') > MAX_CONTENT_BYTES) {
      throw new BadRequestException('Document content exceeds maximum permissible ingestion size (5 MB).');
    }

    // 1. Strict IDOR & Tenant Ownership Verification
    await this.verifyRecordOwnership(scope, input.recordType, input.recordId);

    const rawChunks = this.chunkText(input.content, 600, 100);
    const records = [];

    for (let i = 0; i < rawChunks.length; i++) {
      const chunkText = rawChunks[i] ?? '';
      const guarded = guardUntrustedText(chunkText);
      const embedding = await this.llm.embed(guarded.text);

      const chunkId = crypto.randomUUID();
      records.push({
        id: chunkId,
        tenantId: scope.tenantId,
        siteId: input.siteId ?? scope.activeSiteId,
        recordType: input.recordType,
        recordId: input.recordId,
        revision: input.revision ?? '1.0',
        page: i + 1,
        content: guarded.text,
        embedding: embedding ? JSON.stringify(embedding) : null,
        embeddingModel: embedding ? 'text-embedding-3-small' : null,
        sourceUpdatedAt: new Date().toISOString()
      });
    }

    if (records.length > 0) {
      await this.db.many(this.db.from('AiKnowledgeChunk').insert(records));
    }

    await this.audit.record({
      tenantId: scope.tenantId,
      siteId: input.siteId ?? scope.activeSiteId,
      userId: scope.userId,
      kind: 'document.ingest',
      request: { recordType: input.recordType, recordId: input.recordId, chunkCount: records.length },
      sourceIds: [`${input.recordType}:${input.recordId}`]
    });

    return { ingestedChunks: records.length, recordId: input.recordId };
  }

  /**
   * Compares two engineering documents/revisions for safety critical discrepancies.
   */
  async compareDocuments(
    scope: AiScope,
    docA: { title: string; text: string; revision?: string | undefined },
    docB: { title: string; text: string; revision?: string | undefined }
  ): Promise<DocumentComparisonResult> {
    const safeA = guardUntrustedText(docA.text, 2500);
    const safeB = guardUntrustedText(docB.text, 2500);

    const systemPrompt = [
      'You are an industrial Process Safety Engineer comparing two engineering document revisions or procedures.',
      'Compare Document A and Document B and identify all discrepancies in operating limits, equipment tags, materials, safe practices, or steps.',
      'Respond STRICTLY in valid JSON matching this schema:',
      '{',
      '  "summary": "High-level summary of changes",',
      '  "discrepancies": [',
      '    { "field": "name of parameter/tag", "docAValue": "val A", "docBValue": "val B", "significance": "CRITICAL_SAFETY" | "MODERATE" | "MINOR" }',
      '  ],',
      '  "unresolvedQuestions": ["items requiring technical specialist clarification"]',
      '}'
    ].join('\n');

    const userPrompt = [
      `DOCUMENT A: ${docA.title} (Rev: ${docA.revision ?? 'N/A'})\n${safeA.text}\n`,
      `DOCUMENT B: ${docB.title} (Rev: ${docB.revision ?? 'N/A'})\n${safeB.text}`
    ].join('\n');

    const llm = await this.llm.complete(systemPrompt, userPrompt);

    if (llm?.text) {
      try {
        const cleaned = llm.text.replace(/^```json/i, '').replace(/```$/i, '').trim();
        const parsed = JSON.parse(cleaned) as DocumentComparisonResult;

        await this.audit.record({
          tenantId: scope.tenantId,
          siteId: scope.activeSiteId,
          userId: scope.userId,
          kind: 'document.compare',
          model: llm.model,
          request: { docA: docA.title, docB: docB.title },
          response: { discrepancyCount: parsed.discrepancies?.length ?? 0 }
        });

        return parsed;
      } catch (err) {
        this.logger.warn(`Failed to parse LLM document comparison JSON: ${(err as Error).message}`);
      }
    }

    return {
      summary: `Automated comparative diff between ${docA.title} and ${docB.title}.`,
      discrepancies: [
        {
          field: 'Content Length Diff',
          docAValue: `${docA.text.length} chars`,
          docBValue: `${docB.text.length} chars`,
          significance: Math.abs(docA.text.length - docB.text.length) > 200 ? 'MODERATE' : 'MINOR'
        }
      ],
      unresolvedQuestions: ['Detailed automated LLM comparison unavailable. Technical specialist manual review required.']
    };
  }

  /**
   * Defense-in-depth: Verifies that the targeted record belongs to the requesting tenant.
   */
  async verifyRecordOwnership(scope: AiScope, recordType: string, recordId: string): Promise<boolean> {
    const tableMap: Record<string, string> = {
      document: 'Document',
      equipment: 'Equipment',
      moc: 'Moc',
      ptw: 'PtwPermit',
      incident: 'Incident'
    };

    const tableName = tableMap[recordType.toLowerCase()];
    if (!tableName) {
      // If arbitrary record type, verify against SearchIndex to confirm tenant registration
      const indexed = await this.db.single<{ tenantId: string } | null>(
        this.db.from('SearchIndex').select('tenantId').eq('entityId', recordId).maybeSingle()
      );
      if (indexed && indexed.tenantId !== scope.tenantId) {
        throw new ForbiddenException(`Access denied: Record does not belong to authorized tenant.`);
      }
      return true;
    }

    const row = await this.db.single<{ tenantId: string; siteId?: string | null } | null>(
      this.db.from(tableName).select('tenantId, siteId').eq('id', recordId).maybeSingle()
    );

    if (!row) {
      // Record not found in primary table
      return true;
    }

    if (row.tenantId !== scope.tenantId) {
      throw new ForbiddenException(`Cross-tenant violation: Cannot ingest records belonging to another tenant.`);
    }

    if (row.siteId && !scope.corporateView && !scope.siteIds.includes(row.siteId)) {
      throw new ForbiddenException(`Cross-site violation: You are not authorized for the site of this record.`);
    }

    return true;
  }

  private chunkText(text: string, chunkSize = 600, overlap = 100): string[] {
    const cleaned = text.trim();
    if (!cleaned) return [];
    if (cleaned.length <= chunkSize) return [cleaned];

    const chunks: string[] = [];
    let start = 0;
    while (start < cleaned.length) {
      let end = start + chunkSize;
      if (end < cleaned.length) {
        const nextBreak = cleaned.lastIndexOf('\n', end);
        if (nextBreak > start + 200) {
          end = nextBreak;
        } else {
          const spaceBreak = cleaned.lastIndexOf(' ', end);
          if (spaceBreak > start + 200) end = spaceBreak;
        }
      }
      chunks.push(cleaned.slice(start, end).trim());
      start = end - overlap;
    }
    return chunks.filter((c) => c.length > 20);
  }
}
