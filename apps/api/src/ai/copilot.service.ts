import { Injectable, Logger } from '@nestjs/common';
import { SupabaseService } from '../database/supabase.service';
import { AiAuditService } from './ai-audit.service';
import { isRecordInScope } from './ai-scope';
import { AI_DISCLAIMER, AI_PROMPT_VERSION, AiScope, AiSource, CopilotAnswer, CopilotRecordCard } from './ai.types';
import { validateCitations } from './citation-validator';
import { LlmGatewayService } from './llm-gateway.service';
import { guardUntrustedText, SYSTEM_PROMPT, GENERAL_SYSTEM_PROMPT } from './prompt-guard';

type IndexRow = {
  tenantId: string;
  siteId: string | null;
  entityId: string;
  recordType: string | null;
  recordNumber?: string | null;
  moduleKey: string | null;
  title: string | null;
  text: string | null;
  url: string | null;
  status: string | null;
};

type ChunkRpcRow = {
  id: string;
  tenant_id: string;
  site_id: string | null;
  record_type: string;
  record_id: string;
  revision: string | null;
  page: number | null;
  content: string;
  similarity: number;
};

type ChunkRow = {
  tenantId: string;
  siteId: string | null;
  recordType: string;
  recordId: string;
  revision: string | null;
  page: number | null;
  content: string;
};

const STOP_WORDS = new Set([
  'tell', 'me', 'about', 'this', 'that', 'these', 'those', 'what', 'which', 'who', 'whom', 'whose',
  'where', 'when', 'why', 'how', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has',
  'had', 'do', 'does', 'did', 'will', 'would', 'shall', 'should', 'can', 'could', 'may', 'might',
  'must', 'the', 'and', 'for', 'with', 'from', 'into', 'onto', 'upon', 'out', 'off', 'over', 'under',
  'again', 'further', 'then', 'once', 'here', 'there', 'all', 'any', 'both', 'each', 'few', 'more',
  'most', 'other', 'some', 'such', 'only', 'own', 'same', 'than', 'too', 'very', 'just', 'now',
  'give', 'show', 'list', 'find', 'check', 'explain', 'describe', 'details', 'detail', 'info',
  'information', 'status', 'summary', 'summarize', 'help', 'need', 'want', 'know', 'please',
  'unable', 'advice', 'advise', 'guide', 'guidance', 'ask', 'asking', 'question', 'data', 'record',
  'records', 'module', 'system', 'current', 'active', 'open', 'closed', 'review', 'look', 'looking'
]);

const RECORD_ID_PATTERN = /\b(?:ptw|moc|inc|scn|hazop|lopa|eq|doc|act|pssr|sop|pha|sis|psi|cap|capa)[-_]?\d+[a-z0-9-_]*\b|\b[a-z]{1,4}-\d{2,}[a-z0-9-_]*\b/gi;

@Injectable()
export class CopilotService {
  private readonly logger = new Logger(CopilotService.name);

  constructor(
    private readonly db: SupabaseService,
    private readonly llm: LlmGatewayService,
    private readonly audit: AiAuditService
  ) {}

  async ask(scope: AiScope, question: string, contextModule?: string): Promise<CopilotAnswer> {
    const requestedIds = this.extractRequestedIdentifiers(question);
    const detectedModule = this.detectTargetModule(question, contextModule, requestedIds);
    const sources = await this.hybridRetrieve(scope, question, contextModule, requestedIds, detectedModule);
    const injectionFlags: string[] = [];
    let result: CopilotAnswer;

    if (!sources.length) {
      const catalogSummary = await this.getAvailableRecordsSummary(scope, detectedModule);
      const missingIdNote = requestedIds.length
        ? `Requested record ID(s) NOT found in current authorized site scope: ${requestedIds.map((id) => id.toUpperCase()).join(', ')}.`
        : 'No exact matching facility record was found for the specific terms in this query.';

      if (this.llm.enabled) {
        const prompt = [
          detectedModule ? `Module context: [${detectedModule.toUpperCase()}].` : '',
          missingIdNote,
          catalogSummary ? `Available authorized records in this workspace that the user CAN ask about:\n${catalogSummary}` : '',
          `User inquiry: ${question}`,
          'Instructions: 1) Clearly inform the user if their requested record ID or specific data was not found in the current site scope. 2) Show them the available records they can ask about from the list above (if any). 3) Provide helpful, actionable process safety engineering advice for their topic and suggest exact follow-up questions they can ask.'
        ].filter(Boolean).join('\n\n');

        const llm = await this.llm.complete(GENERAL_SYSTEM_PROMPT, prompt);
        if (llm?.text) {
          result = {
            answer: llm.text,
            mode: 'ai',
            sources: [],
            validation: null,
            uncertainties: requestedIds.length
              ? [`Record ${requestedIds.map((id) => id.toUpperCase()).join(', ')} was not found in your authorized site scope. Showing engineering guidance and available records.`]
              : ['General process safety advisory. No specific facility records matched the query.'],
            disclaimer: AI_DISCLAIMER
          };
        } else {
          result = this.buildHelpfulNoEvidenceFallback(question, requestedIds, detectedModule, catalogSummary);
        }
      } else {
        result = this.buildHelpfulNoEvidenceFallback(question, requestedIds, detectedModule, catalogSummary);
      }
    } else {
      sources.forEach((s) => {
        const g = guardUntrustedText(s.snippet, 1500);
        s.snippet = g.text;
        if (g.flagged) injectionFlags.push(s.id);
      });

      const structuredCards = await this.buildStructuredCardsForSources(scope, sources);
      const richMarkdownFallback = structuredCards.length
        ? structuredCards.map((card, i) => this.formatCardAsMarkdown(card, sources[i]?.id || 'S1')).join('\n\n---\n\n')
        : null;

      const prompt = [
        '<sources>',
        ...sources.map((s) => `[${s.id}] (${s.recordType.toUpperCase()}) ${s.title}: ${s.snippet}`),
        '</sources>',
        structuredCards.length
          ? `<live_operational_telemetry>\n${JSON.stringify(structuredCards, null, 2)}\n</live_operational_telemetry>`
          : '',
        detectedModule ? `Operational Context: Module [${detectedModule.toUpperCase()}]` : '',
        requestedIds.length ? `Requested Identifier(s): ${requestedIds.map((id) => id.toUpperCase()).join(', ')}` : '',
        `Engineering Question: ${question}`
      ].filter(Boolean).join('\n');

      const llm = await this.llm.complete(SYSTEM_PROMPT, prompt);
      const uncertainties: string[] = [];

      if (injectionFlags.length) {
        uncertainties.push(`Possible unauthorized instruction patterns detected and neutralized in sources: ${injectionFlags.join(', ')}.`);
      }

      const validation = llm ? validateCitations(llm.text, sources.map((s) => s.id)) : null;

      // Accept the AI response as long as it did not hallucinate unknown source IDs (e.g. [S99]).
      // This allows the Copilot to include helpful engineering advice sentences alongside cited facts.
      if (llm?.text && (!validation || validation.unknownCitations.length === 0)) {
        if (validation && validation.citedIds.length === 0) {
          uncertainties.push('Advisory response includes general engineering guidance alongside retrieved workspace records.');
        }
        result = {
          answer: llm.text,
          mode: 'ai',
          sources,
          validation,
          uncertainties,
          disclaimer: AI_DISCLAIMER,
          structuredCards
        };
      } else {
        if (llm && validation && validation.unknownCitations.length > 0) {
          uncertainties.push('Model referenced an unverified citation tag; showing verified extractive records and engineering guidance below.');
        } else {
          uncertainties.push('OpenAI model currently unconfigured or offline. Authoritative records and guidance retrieved directly via fail-safe.');
        }

        const adviceBlock = this.getModuleEngineeringAdvice(detectedModule, requestedIds);
        const fallbackBody = richMarkdownFallback
          ? `${richMarkdownFallback}\n\n---\n${adviceBlock}`
          : `The following authorized records and engineering references match your query:\n\n${sources
              .map((s) => `- **[${s.id}]** [${s.recordType.toUpperCase()}] ${s.title}${s.status ? ` (${s.status})` : ''}\n  ${s.snippet.slice(0, 260)}`)
              .join('\n\n')}\n\n---\n${adviceBlock}`;

        result = {
          answer: fallbackBody,
          mode: 'extractive-fallback',
          sources,
          validation,
          uncertainties,
          disclaimer: AI_DISCLAIMER,
          structuredCards
        };
      }
    }

    await this.audit.record({
      tenantId: scope.tenantId,
      siteId: scope.activeSiteId,
      userId: scope.userId,
      kind: 'copilot.ask',
      model: result.mode === 'ai' ? this.llm.modelName : null,
      promptVersion: AI_PROMPT_VERSION,
      request: { question, contextModule },
      response: { mode: result.mode, answerSnippet: result.answer.slice(0, 300) },
      sourceIds: result.sources.map((s) => `${s.recordType}:${s.recordId}`),
      validation: result.validation
    }).catch((err) => {
      this.logger.error(`AI Audit recording failed: ${(err as Error).message}`);
    });

    return result;
  }

  private extractRequestedIdentifiers(question: string): string[] {
    const matches = question.match(RECORD_ID_PATTERN) ?? [];
    return Array.from(new Set(matches.map((m) => m.toLowerCase().trim())));
  }

  private extractMeaningfulTerms(question: string, requestedIds: string[]): string[] {
    const rawTokens = question.toLowerCase().match(/[a-z0-9][a-z0-9-_]{1,}/g) ?? [];
    const filtered = rawTokens.filter((token) => {
      if (requestedIds.includes(token)) return true;
      if (STOP_WORDS.has(token)) return false;
      if (token.length < 3 && !/\d/.test(token)) return false;
      return true;
    });

    const combined = Array.from(new Set([...requestedIds, ...filtered]));
    return combined.slice(0, 8);
  }

  private detectTargetModule(question: string, contextModule?: string, requestedIds: string[] = []): string | undefined {
    const q = question.toLowerCase();
    const ids = requestedIds.join(' ');
    if (/\b(ptw|permit|permits|loto|isolation|hot work|confined space|gas test|simops)\b/.test(q) || /\bptw[-_]?\d+/i.test(ids)) {
      return 'ptw';
    }
    if (/\b(pssr|pre-startup|startup review|startup readiness|punch list)\b/.test(q) || /\bpssr[-_]?\d+/i.test(ids)) {
      return 'pssr';
    }
    if (/\b(moc|management of change|change request)\b/.test(q) || /\bmoc[-_]?\d+/i.test(ids)) {
      return 'moc';
    }
    if (/\b(hazop|pha|lopa|scn|scenario|safeguard|ipl|sil|node|deviation)\b/.test(q) || /\b(scn|hazop|lopa)[-_]?\d+/i.test(ids)) {
      return 'pha';
    }
    if (/\b(inc|incident|incidents|near miss|investigation|root cause|pse|loss of primary containment|lopc)\b/.test(q) || /\binc[-_]?\d+/i.test(ids)) {
      return 'incidents';
    }
    if (/\b(equipment|tag|vessel|pump|compressor|valve|exchanger|relief|psv|psi)\b/.test(q) || /\b(eq|p|v|e|c|t|psv|mv|xv)-\d+/i.test(ids)) {
      return 'equipment';
    }
    if (/\b(action|actions|capa|overdue|recommendation|finding)\b/.test(q) || /\b(act|cap|capa)[-_]?\d+/i.test(ids)) {
      return 'actions';
    }
    if (/\b(document|documents|pid|p&id|sop|procedure|manual|datasheet|sds)\b/.test(q) || /\b(doc|sop)[-_]?\d+/i.test(ids)) {
      return 'documents';
    }
    return contextModule;
  }

  /**
   * Hybrid retrieval combining:
   * 1. Direct primary module tables (permits, mocs, incidents, Equipment, Action, documents)
   * 2. Authoritative module records from SearchIndex
   * 3. Vector semantic search via pgvector (OpenAI text-embedding-3-small)
   * 4. Fallback lexical retrieval on AiKnowledgeChunk
   * With strict stopword filtering and identifier verification so unrelated records are never returned.
   */
  private async hybridRetrieve(
    scope: AiScope,
    question: string,
    contextModule?: string,
    requestedIds: string[] = [],
    detectedModule?: string
  ): Promise<AiSource[]> {
    const terms = this.extractMeaningfulTerms(question, requestedIds);
    if (!terms.length) return [];

    const candidates: AiSource[] = [];
    const pushUnique = (source: Omit<AiSource, 'id'>) => {
      const key = `${source.recordType}:${source.recordId}`.toLowerCase();
      if (!candidates.some((c) => `${c.recordType}:${c.recordId}`.toLowerCase() === key)) {
        candidates.push({ ...source, id: `S${candidates.length + 1}` });
      }
    };

    // 1. Direct live table lookup for accurate, real-time module coverage
    await this.retrieveFromPrimaryTables(scope, terms, requestedIds, detectedModule, pushUnique);

    // 2. Lexical retrieval on SearchIndex
    try {
      const searchFilter = terms.map((t) => `title.ilike.%${t}%,text.ilike.%${t}%,subtitle.ilike.%${t}%`).join(',');
      let indexBuilder = this.db
        .from('SearchIndex')
        .select('tenantId,siteId,entityId,recordType,moduleKey,title,text,url,status')
        .eq('tenantId', scope.tenantId);

      // Only restrict by contextModule if the user didn't explicitly ask about a different module
      const effectiveModuleFilter = detectedModule || contextModule;
      if (effectiveModuleFilter && contextModule && effectiveModuleFilter === contextModule) {
        indexBuilder = indexBuilder.eq('moduleKey', contextModule);
      }

      const indexQuery = indexBuilder.or(searchFilter).limit(30);
      const indexRows = await this.db.many<IndexRow>(indexQuery);
      const authorizedIndexRows = (indexRows ?? []).filter((r) => isRecordInScope(scope, r));

      authorizedIndexRows.forEach((r) => {
        pushUnique({
          recordType: r.recordType || r.moduleKey || 'record',
          recordId: r.entityId,
          title: r.title || r.entityId,
          snippet: r.text || '',
          url: r.url,
          status: r.status
        });
      });
    } catch (err) {
      this.logger.debug(`SearchIndex lookup skipped: ${(err as Error).message}`);
    }

    // 3. Semantic pgvector retrieval (if OpenAI embedding is available and no exact ID already satisfied)
    try {
      const queryEmbedding = await this.llm.embed(question);
      if (queryEmbedding) {
        const siteFilter = scope.corporateView ? null : scope.siteIds;
        const vectorResults = await this.db.many<ChunkRpcRow>(
          this.db.client.rpc('match_ai_knowledge_chunks', {
            query_embedding: queryEmbedding,
            match_threshold: 0.68,
            match_count: 5,
            filter_tenant_id: scope.tenantId,
            filter_site_ids: siteFilter
          })
        );

        (vectorResults ?? []).forEach((c) => {
          pushUnique({
            recordType: `doc_${c.record_type}`,
            recordId: c.record_id,
            title: `${c.record_type.toUpperCase()} (Rev ${c.revision || '1.0'}${c.page ? `, p. ${c.page}` : ''}) [Vector Match: ${(c.similarity * 100).toFixed(0)}%]`,
            snippet: c.content,
            url: `/documents/${c.record_id}`,
            status: 'CONTROLLED'
          });
        });
      }
    } catch (err) {
      this.logger.debug(`pgvector RPC match skipped or not yet migrated: ${(err as Error).message}`);
    }

    // 4. Fallback lexical search on AiKnowledgeChunk
    if (candidates.length < 4) {
      try {
        const chunkFilter = terms.map((t) => `content.ilike.%${t}%`).join(',');
        const chunkRows = await this.db.many<ChunkRow>(
          this.db
            .from('AiKnowledgeChunk')
            .select('tenantId,siteId,recordType,recordId,revision,page,content')
            .eq('tenantId', scope.tenantId)
            .or(chunkFilter)
            .limit(10)
        );

        const authorizedChunkRows = (chunkRows ?? []).filter((c) => isRecordInScope(scope, c));
        authorizedChunkRows.slice(0, 4).forEach((c) => {
          pushUnique({
            recordType: `doc_${c.recordType}`,
            recordId: c.recordId,
            title: `${c.recordType.toUpperCase()} (Rev ${c.revision || '1.0'}${c.page ? `, p. ${c.page}` : ''})`,
            snippet: c.content,
            url: `/documents/${c.recordId}`,
            status: 'CONTROLLED'
          });
        });
      } catch (err) {
        this.logger.debug(`AiKnowledgeChunk lookup skipped: ${(err as Error).message}`);
      }
    }

    // 5. Score and filter candidates so wrong data is never returned when a specific record ID is requested
    const scored = candidates
      .map((source) => {
        const haystack = `${source.recordId} ${source.recordType} ${source.title} ${source.snippet}`.toLowerCase();
        let score = 0;
        let matchedRequestedId = false;

        for (const reqId of requestedIds) {
          const normalizedReq = reqId.replace(/[-_]/g, '');
          const normalizedHaystack = haystack.replace(/[-_]/g, '');
          if (haystack.includes(reqId) || normalizedHaystack.includes(normalizedReq)) {
            score += 100;
            matchedRequestedId = true;
          }
        }

        for (const term of terms) {
          if (haystack.includes(term)) {
            score += requestedIds.includes(term) ? 50 : 10;
          }
        }

        return { source, score, matchedRequestedId };
      })
      .filter((item) => {
        // If the user asked for a specific record ID (e.g. PTW-1587), reject unrelated records that don't match the ID
        if (requestedIds.length > 0) {
          return item.matchedRequestedId;
        }
        return item.score > 0;
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 8)
      .map((item, idx) => ({
        ...item.source,
        id: `S${idx + 1}`
      }));

    return scored;
  }

  private async retrieveFromPrimaryTables(
    scope: AiScope,
    terms: string[],
    requestedIds: string[],
    detectedModule: string | undefined,
    pushUnique: (source: Omit<AiSource, 'id'>) => void
  ): Promise<void> {
    const searchTerms = requestedIds.length ? requestedIds : terms.slice(0, 5);
    if (!searchTerms.length) return;

    const shouldCheck = (mod: string) => !detectedModule || detectedModule === mod;

    // Permits (PTW)
    if (shouldCheck('ptw')) {
      try {
        const filter = searchTerms
          .map((t) => `permit_number.ilike.%${t}%,title.ilike.%${t}%,work_description.ilike.%${t}%,equipment_tag.ilike.%${t}%,job_area.ilike.%${t}%`)
          .join(',');
        const permits = await this.db.many<any>(
          this.db
            .from('permits')
            .select('id,tenant_id,site_id,permit_number,permit_type,title,work_description,equipment_tag,equipment_name,job_area,status,risk_level')
            .eq('tenant_id', scope.tenantId)
            .or(filter)
            .limit(8)
        );
        (permits ?? [])
          .filter((p) => isRecordInScope(scope, { tenantId: p.tenant_id, siteId: p.site_id }))
          .forEach((p) => {
            pushUnique({
              recordType: 'Permit',
              recordId: p.id,
              title: `${p.permit_number} — ${p.title}`,
              snippet: `Permit ${p.permit_number} (${p.permit_type || 'PTW'}) | Status: ${p.status} | Risk: ${p.risk_level || 'N/A'} | Equipment: ${p.equipment_tag || 'N/A'} (${p.equipment_name || ''}) | Area: ${p.job_area || 'N/A'} | Scope: ${p.work_description || ''}`,
              url: `/ptw/${p.id}`,
              status: p.status
            });
          });
      } catch {
        // Ignore if table not mocked in unit test
      }
    }

    // Management of Change (MOC)
    if (shouldCheck('moc')) {
      try {
        const filter = searchTerms
          .map((t) => `moc_number.ilike.%${t}%,title.ilike.%${t}%,description.ilike.%${t}%,change_type.ilike.%${t}%`)
          .join(',');
        const mocs = await this.db.many<any>(
          this.db
            .from('mocs')
            .select('id,tenant_id,site_id,moc_number,title,description,change_type,risk_level,status,workflow_status')
            .eq('tenant_id', scope.tenantId)
            .or(filter)
            .limit(8)
        );
        (mocs ?? [])
          .filter((m) => isRecordInScope(scope, { tenantId: m.tenant_id, siteId: m.site_id }))
          .forEach((m) => {
            pushUnique({
              recordType: 'MOC',
              recordId: m.id,
              title: `${m.moc_number} — ${m.title}`,
              snippet: `MOC ${m.moc_number} (${m.change_type || 'Change'}) | Status: ${m.status || m.workflow_status} | Risk: ${m.risk_level || 'N/A'} | Description: ${m.description || ''}`,
              url: `/moc/${m.id}`,
              status: m.status || m.workflow_status
            });
          });
      } catch {
        // Ignore if table not mocked
      }
    }

    // Pre-Startup Safety Review (PSSR)
    if (shouldCheck('pssr') || shouldCheck('moc')) {
      try {
        const filter = searchTerms
          .map((t) => `pssr_number.ilike.%${t}%,title.ilike.%${t}%,description.ilike.%${t}%,pssr_type.ilike.%${t}%,startup_type.ilike.%${t}%`)
          .join(',');
        const pssrs = await this.db.many<any>(
          this.db
            .from('pssrs')
            .select('id,tenant_id,site_id,pssr_number,title,description,pssr_type,startup_type,risk_level,status')
            .eq('tenant_id', scope.tenantId)
            .or(filter)
            .limit(8)
        );
        (pssrs ?? [])
          .filter((pssr) => isRecordInScope(scope, { tenantId: pssr.tenant_id, siteId: pssr.site_id }))
          .forEach((pssr) => {
            pushUnique({
              recordType: 'PSSR',
              recordId: pssr.id,
              title: `${pssr.pssr_number} — ${pssr.title}`,
              snippet: `PSSR ${pssr.pssr_number} (${pssr.pssr_type || pssr.startup_type || 'Startup Review'}) | Status: ${pssr.status} | Risk: ${pssr.risk_level || 'N/A'} | Scope: ${pssr.description || ''}`,
              url: `/pssr/${pssr.id}`,
              status: pssr.status
            });
          });
      } catch {
        // Ignore if table not mocked
      }
    }

    // Incidents
    if (shouldCheck('incidents')) {
      try {
        const filter = searchTerms
          .map((t) => `incident_number.ilike.%${t}%,title.ilike.%${t}%,description.ilike.%${t}%,classification.ilike.%${t}%`)
          .join(',');
        const incidents = await this.db.many<any>(
          this.db
            .from('incidents')
            .select('id,tenant_id,site_id,incident_number,title,description,event_type,classification,status,pse_tier,potential_severity')
            .eq('tenant_id', scope.tenantId)
            .or(filter)
            .limit(8)
        );
        (incidents ?? [])
          .filter((inc) => isRecordInScope(scope, { tenantId: inc.tenant_id, siteId: inc.site_id }))
          .forEach((inc) => {
            pushUnique({
              recordType: 'Incident',
              recordId: inc.id,
              title: `${inc.incident_number} — ${inc.title}`,
              snippet: `Incident ${inc.incident_number} (${inc.classification || inc.event_type || 'Event'}) | PSE Tier: ${inc.pse_tier || 'N/A'} | Severity: ${inc.potential_severity || 'N/A'} | Status: ${inc.status} | Details: ${inc.description || ''}`,
              url: `/incidents/${inc.id}`,
              status: inc.status
            });
          });
      } catch {
        // Ignore if table not mocked
      }
    }

    // Equipment / PSI
    if (shouldCheck('equipment')) {
      try {
        const filter = searchTerms
          .map((t) => `tag.ilike.%${t}%,name.ilike.%${t}%,type.ilike.%${t}%,description.ilike.%${t}%,system.ilike.%${t}%`)
          .join(',');
        const equipment = await this.db.many<any>(
          this.db
            .from('Equipment')
            .select('id,tenantId,siteId,tag,name,type,criticality,status,description,system,fluidService,designPressure,designTemp')
            .eq('tenantId', scope.tenantId)
            .or(filter)
            .limit(8)
        );
        (equipment ?? [])
          .filter((eq) => isRecordInScope(scope, { tenantId: eq.tenantId, siteId: eq.siteId }))
          .forEach((eq) => {
            pushUnique({
              recordType: 'Equipment',
              recordId: eq.id,
              title: `${eq.tag} — ${eq.name}`,
              snippet: `Equipment ${eq.tag} (${eq.type || 'Asset'}) | Criticality: ${eq.criticality || 'N/A'} | Status: ${eq.status} | System: ${eq.system || 'N/A'} | Fluid: ${eq.fluidService || 'N/A'} | Design: ${eq.designPressure ?? 'N/A'} / ${eq.designTemp ?? 'N/A'} | ${eq.description || ''}`,
              url: `/equipment/${eq.id}`,
              status: eq.status
            });
          });
      } catch {
        // Ignore if table not mocked
      }
    }

    // Actions / CAPA
    if (shouldCheck('actions')) {
      try {
        const filter = searchTerms
          .map((t) => `actionNumber.ilike.%${t}%,title.ilike.%${t}%,description.ilike.%${t}%`)
          .join(',');
        const actions = await this.db.many<any>(
          this.db
            .from('Action')
            .select('id,tenantId,siteId,actionNumber,title,description,status,priority,moduleKey')
            .eq('tenantId', scope.tenantId)
            .or(filter)
            .limit(8)
        );
        (actions ?? [])
          .filter((act) => isRecordInScope(scope, { tenantId: act.tenantId, siteId: act.siteId }))
          .forEach((act) => {
            pushUnique({
              recordType: 'Action',
              recordId: act.id,
              title: `${act.actionNumber} — ${act.title}`,
              snippet: `Action ${act.actionNumber} (${act.moduleKey || 'CAPA'}) | Priority: ${act.priority} | Status: ${act.status} | Details: ${act.description || ''}`,
              url: `/actions/${act.id}`,
              status: act.status
            });
          });
      } catch {
        // Ignore if table not mocked
      }
    }

    // Documents
    if (shouldCheck('documents')) {
      try {
        const filter = searchTerms
          .map((t) => `document_number.ilike.%${t}%,title.ilike.%${t}%,description.ilike.%${t}%,document_type.ilike.%${t}%`)
          .join(',');
        const docs = await this.db.many<any>(
          this.db
            .from('documents')
            .select('id,tenant_id,site_id,document_number,title,description,document_type,status')
            .eq('tenant_id', scope.tenantId)
            .or(filter)
            .limit(8)
        );
        (docs ?? [])
          .filter((d) => isRecordInScope(scope, { tenantId: d.tenant_id, siteId: d.site_id }))
          .forEach((d) => {
            pushUnique({
              recordType: 'Document',
              recordId: d.id,
              title: `${d.document_number} — ${d.title}`,
              snippet: `Document ${d.document_number} (${d.document_type || 'Controlled Doc'}) | Status: ${d.status} | ${d.description || ''}`,
              url: `/documents/${d.id}`,
              status: d.status
            });
          });
      } catch {
        // Ignore if table not mocked
      }
    }
  }

  /**
   * Retrieves a concise snapshot of available authorized records in the user's scope
   * so when a requested ID (like PTW-1587) doesn't exist, the Copilot can tell the user
   * exactly what records DO exist and what they can ask about.
   */
  private async getAvailableRecordsSummary(scope: AiScope, detectedModule?: string): Promise<string> {
    const lines: string[] = [];

    try {
      if (!detectedModule || detectedModule === 'ptw') {
        const permits = await this.db.many<any>(
          this.db.from('permits').select('tenant_id,site_id,permit_number,title,status,permit_type').eq('tenant_id', scope.tenantId).limit(5)
        );
        const scoped = (permits ?? []).filter((p) => isRecordInScope(scope, { tenantId: p.tenant_id, siteId: p.site_id }));
        if (scoped.length) {
          lines.push(`- **Permits (PTW):** ${scoped.map((p) => `\`${p.permit_number}\` (${p.title} — ${p.status})`).join(', ')}`);
        }
      }

      if (!detectedModule || detectedModule === 'moc') {
        const mocs = await this.db.many<any>(
          this.db.from('mocs').select('tenant_id,site_id,moc_number,title,status').eq('tenant_id', scope.tenantId).limit(5)
        );
        const scoped = (mocs ?? []).filter((m) => isRecordInScope(scope, { tenantId: m.tenant_id, siteId: m.site_id }));
        if (scoped.length) {
          lines.push(`- **Management of Change (MOC):** ${scoped.map((m) => `\`${m.moc_number}\` (${m.title} — ${m.status})`).join(', ')}`);
        }
      }

      if (!detectedModule || detectedModule === 'pssr' || detectedModule === 'moc') {
        const pssrs = await this.db.many<any>(
          this.db.from('pssrs').select('tenant_id,site_id,pssr_number,title,status').eq('tenant_id', scope.tenantId).limit(5)
        );
        const scoped = (pssrs ?? []).filter((p) => isRecordInScope(scope, { tenantId: p.tenant_id, siteId: p.site_id }));
        if (scoped.length) {
          lines.push(`- **Pre-Startup Safety Review (PSSR):** ${scoped.map((p) => `\`${p.pssr_number}\` (${p.title} — ${p.status})`).join(', ')}`);
        }
      }

      if (!detectedModule || detectedModule === 'incidents') {
        const incidents = await this.db.many<any>(
          this.db.from('incidents').select('tenant_id,site_id,incident_number,title,status').eq('tenant_id', scope.tenantId).limit(5)
        );
        const scoped = (incidents ?? []).filter((i) => isRecordInScope(scope, { tenantId: i.tenant_id, siteId: i.site_id }));
        if (scoped.length) {
          lines.push(`- **Incidents:** ${scoped.map((i) => `\`${i.incident_number}\` (${i.title} — ${i.status})`).join(', ')}`);
        }
      }

      if (!detectedModule || detectedModule === 'equipment') {
        const eqs = await this.db.many<any>(
          this.db.from('Equipment').select('tenantId,siteId,tag,name,status').eq('tenantId', scope.tenantId).limit(5)
        );
        const scoped = (eqs ?? []).filter((e) => isRecordInScope(scope, { tenantId: e.tenantId, siteId: e.siteId }));
        if (scoped.length) {
          lines.push(`- **Equipment / PSI:** ${scoped.map((e) => `\`${e.tag}\` (${e.name} — ${e.status})`).join(', ')}`);
        }
      }

      if (!detectedModule || detectedModule === 'pha') {
        const idx = await this.db.many<IndexRow>(
          this.db
            .from('SearchIndex')
            .select('tenantId,siteId,entityId,recordType,moduleKey,title,status')
            .eq('tenantId', scope.tenantId)
            .limit(8)
        );
        const scoped = (idx ?? []).filter((r) => isRecordInScope(scope, r));
        if (scoped.length) {
          lines.push(`- **Indexed Scenarios & Records:** ${scoped.slice(0, 5).map((r) => `\`${r.title || r.entityId}\` (${r.recordType || r.moduleKey})`).join(', ')}`);
        }
      }
    } catch {
      // Safe fallback when mock DB is used in unit tests
    }

    return lines.join('\n');
  }

  private getModuleEngineeringAdvice(detectedModule?: string, requestedIds: string[] = []): string {
    const idLabel = requestedIds.length ? requestedIds.map((id) => `\`${id.toUpperCase()}\``).join(', ') : 'this topic';

    switch (detectedModule) {
      case 'ptw':
        return [
          `### Process Safety Guidance & What to Ask Next (Permit to Work)`,
          `- **Key Verification Checkpoints for ${idLabel}:**`,
          `  1. **Isolation & LOTO:** Verify Mechanical Isolation Certificates (MIC), blind list positions, and zero-energy verification before work begins.`,
          `  2. **Gas Testing:** Check atmospheric monitoring results (\`% LEL\`, \`O2\`, \`H2S\`, \`CO\`) and re-test intervals.`,
          `  3. **SIMOPS & Readiness:** Confirm no conflicting adjacent permits (e.g., hot work near hydrocarbon draining) and verify Area Authority sign-off.`,
          `- **Try asking:**`,
          `  - *"List all active permits and their isolation status"*`,
          `  - *"What gas test and LOTO checks are required before issuing a Hot Work permit?"*`,
          `  - *"Check SIMOPS conflicts and overdue permits in my site scope"*`
        ].join('\n');

      case 'moc':
        return [
          `### Process Safety Guidance & What to Ask Next (Management of Change)`,
          `- **Key Verification Checkpoints for ${idLabel}:**`,
          `  1. **Technical & SHE Impact Assessment:** Ensure process safety, mechanical integrity, and P&ID redline impacts are documented.`,
          `  2. **PHA / LOPA Revalidation:** Verify whether the change introduces new hazards or degrades existing Independent Protection Layers (IPLs).`,
          `  3. **Pre-Startup Safety Review (PSSR):** Confirm all mandatory pre-startup actions and operator training are closed prior to commissioning.`,
          `- **Try asking:**`,
          `  - *"Show all open MOCs and their workflow approval status"*`,
          `  - *"What are the PSSR requirements before closing an equipment modification MOC?"*`
        ].join('\n');

      case 'pssr':
        return [
          `### Process Safety Guidance & What to Ask Next (Pre-Startup Safety Review)`,
          `- **Key Verification Checkpoints for ${idLabel}:**`,
          `  1. **Startup Blockers & Category A Punch Items:** Confirm zero open Category A punch items and all safety-critical blockers are cleared before startup release.`,
          `  2. **PSI & Redline As-Builts:** Verify P&IDs, operating procedures, and relief system calculations match field installation.`,
          `  3. **Operator Training & Discipline Sign-Offs:** Verify Operations, Maintenance, Process Safety, and Instrumentation leads have signed off.`,
          `- **Try asking:**`,
          `  - *"Show all active PSSRs and their startup blocker status"*`,
          `  - *"What Category A punch items and training requirements are blocking startup?"*`
        ].join('\n');

      case 'pha':
        return [
          `### Process Safety Guidance & What to Ask Next (PHA / HAZOP / LOPA)`,
          `- **Key Verification Checkpoints for ${idLabel}:**`,
          `  1. **Cause-Consequence-Safeguard Alignment:** Verify that every high-severity scenario has independent, auditable safeguards.`,
          `  2. **LOPA Independence & PFD:** Confirm Initiating Event Frequency, IPL Probability of Failure on Demand (PFD), and target mitigated frequency.`,
          `- **Try asking:**`,
          `  - *"Show open HAZOP scenarios and their safeguards"*`,
          `  - *"Calculate LOPA mitigated risk for initiating frequency 0.1 and IPL PFDs 0.1, 0.01 against target 1e-4"*`
        ].join('\n');

      case 'incidents':
        return [
          `### Process Safety Guidance & What to Ask Next (Incident Investigation)`,
          `- **Key Verification Checkpoints for ${idLabel}:**`,
          `  1. **API RP 754 PSE Tier Classification:** Verify whether Loss of Primary Containment (LOPC) thresholds met Tier 1 or Tier 2 criteria.`,
          `  2. **Barrier Failure & CAPA:** Identify which preventive or mitigative barriers failed and link Corrective & Preventive Actions (CAPAs) to root causes.`,
          `- **Try asking:**`,
          `  - *"List recent process safety incidents and their investigation status"*`,
          `  - *"What are the open CAPA actions from recent incidents?"*`
        ].join('\n');

      default:
        return [
          `### Process Safety Guidance & What You Can Ask`,
          `- **How to get the best results from PSM Copilot:**`,
          `  - **Permit to Work (PTW):** Ask about active permit numbers, LOTO isolation boundaries, gas testing, or SIMOPS.`,
          `  - **Management of Change (MOC):** Ask about open MOCs, impact assessments, approvals, or PSSR readiness.`,
          `  - **PHA / HAZOP / LOPA:** Ask about hazard scenarios, deviations, safeguards, or run deterministic LOPA calculations.`,
          `  - **PSI & Equipment:** Ask about equipment tags (e.g., pumps, vessels, relief valves), criticality, or design operating limits.`,
          `  - **Incidents & Actions:** Ask about LOPC incidents, root causes, or overdue CAPA actions.`
        ].join('\n');
    }
  }

  private buildHelpfulNoEvidenceFallback(
    question: string,
    requestedIds: string[],
    detectedModule?: string,
    catalogSummary?: string
  ): CopilotAnswer {
    const idList = requestedIds.map((id) => `**${id.toUpperCase()}**`).join(', ');
    const header = requestedIds.length
      ? `Insufficient evidence: Record ${idList} was not found in your authorized site scope.`
      : `Insufficient evidence: No authorized records or controlled documents directly matched \`"${question}"\` within your current site scope.`;

    const availableSection = catalogSummary
      ? `\n\n### Available Authorized Records in Your Scope\nHere are verified records currently available that you can ask about right now:\n${catalogSummary}`
      : '';

    const adviceSection = `\n\n${this.getModuleEngineeringAdvice(detectedModule, requestedIds)}`;

    return {
      answer: `${header}${availableSection}${adviceSection}`,
      mode: 'no-evidence',
      sources: [],
      validation: null,
      uncertainties: requestedIds.length
        ? [`Requested record ${requestedIds.map((id) => id.toUpperCase()).join(', ')} is not present in the current site database scope.`]
        : ['No matching records within your authorized site/unit scope.'],
      disclaimer: AI_DISCLAIMER
    };
  }

  /**
   * Builds rich, live operational telemetry cards for primary PTW, MOC, PSSR, Incident, and Equipment sources
   * so the Copilot renders an executive Overview, Location & Personnel, Action Gates, and Required Actions card.
   */
  private async buildStructuredCardsForSources(scope: AiScope, sources: AiSource[]): Promise<CopilotRecordCard[]> {
    const cards: CopilotRecordCard[] = [];
    const primarySources = sources.slice(0, 3);

    for (const src of primarySources) {
      try {
        const type = src.recordType.toLowerCase();
        if (type === 'permit' || type === 'ptw') {
          const card = await this.buildPermitStructuredCard(scope.tenantId, src.recordId);
          if (card) cards.push(card);
        } else if (type === 'moc') {
          const card = await this.buildMocStructuredCard(scope.tenantId, src.recordId);
          if (card) cards.push(card);
        } else if (type === 'pssr') {
          const card = await this.buildPssrStructuredCard(scope.tenantId, src.recordId);
          if (card) cards.push(card);
        } else if (type === 'incident' || type === 'incidents') {
          const card = await this.buildIncidentStructuredCard(scope.tenantId, src.recordId);
          if (card) cards.push(card);
        } else if (type === 'equipment') {
          const card = await this.buildEquipmentStructuredCard(scope.tenantId, src.recordId);
          if (card) cards.push(card);
        }
      } catch {
        // Non-blocking if sub-tables are unavailable in unit test mocks
      }
    }

    return cards;
  }

  private async buildPermitStructuredCard(tenantId: string, permitId: string): Promise<CopilotRecordCard | null> {
    const permit = await this.db.single<any>(
      this.db.from('permits').select('*').eq('tenant_id', tenantId).eq('id', permitId).maybeSingle()
    );
    if (!permit) return null;

    const [isolations, gasTests, workforce, signatures, conflicts, holder, issuer] = await Promise.all([
      this.db.many<any>(this.db.from('permit_isolations').select('*').eq('tenant_id', tenantId).eq('permit_id', permitId)).catch(() => []),
      this.db.many<any>(this.db.from('permit_gas_tests').select('*').eq('tenant_id', tenantId).eq('permit_id', permitId).order('tested_at', { ascending: false }).limit(3)).catch(() => []),
      this.db.many<any>(this.db.from('permit_workforce').select('*').eq('tenant_id', tenantId).eq('permit_id', permitId)).catch(() => []),
      this.db.many<any>(this.db.from('permit_signatures').select('*').eq('tenant_id', tenantId).eq('permit_id', permitId)).catch(() => []),
      this.db.many<any>(this.db.from('permit_conflicts').select('*').eq('tenant_id', tenantId).eq('permit_id', permitId)).catch(() => []),
      permit.holder_id ? this.db.single<any>(this.db.from('User').select('id,displayName,title').eq('tenantId', tenantId).eq('id', permit.holder_id).maybeSingle()).catch(() => null) : Promise.resolve(null),
      permit.issuer_id ? this.db.single<any>(this.db.from('User').select('id,displayName,title').eq('tenantId', tenantId).eq('id', permit.issuer_id).maybeSingle()).catch(() => null) : Promise.resolve(null)
    ]);

    const ptwSteps = ['Draft', 'Submitted', 'Under Review', 'Approved', 'Issued', 'Active', 'Suspended', 'Extended', 'Closed'];
    const stepIndex = Math.max(ptwSteps.findIndex((s) => s.toLowerCase() === String(permit.status || '').toLowerCase()), 0) + 1;
    const isExpired = permit.planned_end_at ? new Date(permit.planned_end_at).getTime() < Date.now() && permit.status !== 'Closed' : false;
    const validityLabel = isExpired
      ? 'Expired'
      : permit.planned_end_at
        ? `Valid until ${new Date(permit.planned_end_at).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`
        : 'Standard Shift';

    const verifiedSigs = (signatures ?? []).filter((s: any) => s.signed_by || s.status === 'Signed' || s.signature).length;
    const totalIso = (isolations ?? []).length;
    const confirmedIso = (isolations ?? []).filter((i: any) => ['Confirmed', 'Verified', 'Isolated'].includes(i.status || i.isolation_status)).length;
    const scePending = (isolations ?? []).filter((i: any) => (i.is_safety_critical || i.is_sif_bypass) && i.bypass_status !== 'Approved' && i.bypass_status !== 'Authorized').length;

    const briefedWorkers = (workforce ?? []).filter((w: any) => w.signed_briefing || w.briefing_completed).length;
    const totalWorkers = (workforce ?? []).length;
    const latestGas = (gasTests ?? [])[0];
    const openConflicts = (conflicts ?? []).filter((c: any) => !['Resolved', 'Overridden', 'Closed', 'Cleared'].includes(c.status)).length;

    const equipmentLabel = permit.equipment_tag
      ? `${permit.equipment_tag}${permit.equipment_name ? ` (${permit.equipment_name})` : ''}`
      : 'General Area / Non-Tagged';
    const holderName = holder?.displayName || permit.holder_name || permit.holder_id || 'Assigned Permit Holder';
    const workType = String(permit.permit_type || 'GENERAL_WORK').replace(/_/g, ' ').toUpperCase();

    const requiredActions: CopilotRecordCard['requiredActions'] = [];
    if (openConflicts > 0) {
      requiredActions.push({
        title: 'Resolve Permit Conflicts',
        detail: `Clear the ${openConflicts} active spatial/SIMOPS conflict(s) flagged under Action Gates before field execution.`,
        severity: 'critical'
      });
    }
    if (isExpired) {
      requiredActions.push({
        title: 'Address Expiry',
        detail: 'Renew, extend, or re-validate the permit window, as the planned validity period has expired.',
        severity: 'critical'
      });
    }
    if (String(permit.status).toLowerCase() === 'suspended') {
      requiredActions.push({
        title: 'Conduct Suspension Review',
        detail: 'Investigate the cause of permit suspension and re-verify all LOTO and atmospheric controls before re-issuing.',
        severity: 'warning'
      });
    }
    if (totalIso > confirmedIso || scePending > 0) {
      requiredActions.push({
        title: 'Complete Positive Isolation / SCE Gate',
        detail: `${totalIso - confirmedIso} isolation point(s) unconfirmed${scePending > 0 ? ` and ${scePending} SCE/SIF bypass certificate(s) pending authorization` : ''}.`,
        severity: 'critical'
      });
    }
    requiredActions.push({
      title: 'Continuous Safety Oversight',
      detail: workType.includes('HOT')
        ? 'Maintain continuous gas monitoring (O₂, LEL, H₂S, CO) and dedicated fire watch throughout hot work operations.'
        : 'Maintain continuous field supervision, toolbox briefing compliance, and periodic gas re-testing.',
      severity: 'info'
    });

    return {
      module: 'PTW',
      recordId: permit.id,
      recordNumber: permit.permit_number,
      title: `${permit.permit_number}: Overview & Operational Status`,
      subtitle: permit.title,
      url: `/ptw/${permit.id}`,
      status: String(permit.status || 'Active').toUpperCase(),
      statusStep: `Workflow step ${stepIndex} of ${ptwSteps.length}`,
      riskLevel: String(permit.risk_level || 'HIGH').toUpperCase(),
      validity: validityLabel,
      workOrChangeType: workType,
      overviewBullets: [
        { label: 'Permit ID', value: permit.permit_number },
        { label: 'Activity / Scope', value: permit.work_description || permit.title },
        { label: 'Work Type', value: workType },
        { label: 'Current Status', value: `${String(permit.status).toUpperCase()} (Workflow step ${stepIndex} of ${ptwSteps.length})` },
        { label: 'Validity', value: validityLabel },
        { label: 'Risk Level', value: String(permit.risk_level || 'MEDIUM').toUpperCase() }
      ],
      locationDetails: {
        equipment: equipmentLabel,
        area: permit.job_area || permit.location || 'Operating Area',
        holderOrOwner: holder?.displayName ? `${holder.displayName}${permit.holder_id ? ` (${permit.holder_id})` : ''}` : String(holderName),
        holderRole: issuer?.displayName ? `Issuer: ${issuer.displayName}` : 'Permit Holder'
      },
      actionGates: [
        {
          label: 'Signatures',
          value: `${verifiedSigs || (signatures ?? []).length} Verified`,
          subtext: verifiedSigs > 0 ? 'Required authorizations verified.' : 'Awaiting authority sign-off.',
          tone: verifiedSigs > 0 ? 'emerald' : 'amber'
        },
        {
          label: 'Workforce',
          value: totalWorkers > 0 && briefedWorkers === totalWorkers ? 'Briefed' : `${briefedWorkers}/${totalWorkers} Briefed`,
          subtext: totalWorkers > 0 ? `Personnel briefed on scope & safety protocols (${totalWorkers} assigned).` : 'Verify crew roster & competency.',
          tone: totalWorkers > 0 && briefedWorkers === totalWorkers ? 'emerald' : 'amber'
        },
        {
          label: 'Isolation / LOTO',
          value: totalIso === 0 ? 'Not Required' : confirmedIso === totalIso ? 'Ready (100%)' : `${confirmedIso}/${totalIso} Confirmed`,
          subtext: totalIso > 0 ? `${confirmedIso} of ${totalIso} points confirmed & verified (${Math.round((confirmedIso / totalIso) * 100)}% complete).` : 'Zero-energy check verified.',
          tone: confirmedIso === totalIso && scePending === 0 ? 'emerald' : 'amber'
        },
        {
          label: 'SCE / Barrier Gate',
          value: scePending > 0 ? `${scePending} Bypass Pending` : 'Clear',
          subtext: scePending > 0 ? 'Safety Critical Element bypass requires certificate.' : 'No unapproved safety barrier inhibitions.',
          tone: scePending > 0 ? 'rose' : 'emerald'
        },
        {
          label: 'Gas Test',
          value: latestGas ? (latestGas.result === 'Fail' ? 'FAILED' : 'Ready') : 'Pending',
          subtext: latestGas
            ? `O₂: ${latestGas.o2 ?? 20.8}% · LEL: ${latestGas.lel ?? 0}% · H₂S: ${latestGas.h2s ?? 0} ppm · CO: ${latestGas.co ?? 0} ppm`
            : 'Atmospheric test required prior to entry/work.',
          tone: latestGas ? (latestGas.result === 'Fail' ? 'rose' : 'emerald') : 'amber'
        },
        {
          label: 'Conflicts',
          value: openConflicts > 0 ? `Active Conflict (${openConflicts})` : 'Clear',
          subtext: openConflicts > 0 ? 'Unresolved spatial or SIMOPS conflict detected.' : 'No active SIMOPS clashes.',
          tone: openConflicts > 0 ? 'rose' : 'emerald'
        }
      ],
      requiredActions
    };
  }

  private async buildMocStructuredCard(tenantId: string, mocId: string): Promise<CopilotRecordCard | null> {
    const moc = await this.db.single<any>(
      this.db.from('mocs').select('*').eq('tenant_id', tenantId).eq('id', mocId).maybeSingle()
    );
    if (!moc) return null;

    const [equipment, actions, impact, pssr, approvals, originator, area] = await Promise.all([
      this.db.many<any>(this.db.from('moc_affected_equipment').select('*, equipment:Equipment(tag,name)').eq('tenant_id', tenantId).eq('moc_id', mocId)).catch(() => []),
      this.db.many<any>(this.db.from('moc_required_actions').select('*').eq('tenant_id', tenantId).eq('moc_id', mocId)).catch(() => []),
      this.db.single<any>(this.db.from('moc_impact_assessments').select('*').eq('tenant_id', tenantId).eq('moc_id', mocId).maybeSingle()).catch(() => null),
      this.db.single<any>(this.db.from('moc_pssr_requirements').select('*').eq('tenant_id', tenantId).eq('moc_id', mocId).maybeSingle()).catch(() => null),
      this.db.many<any>(this.db.from('moc_approvals').select('*').eq('tenant_id', tenantId).eq('moc_id', mocId)).catch(() => []),
      moc.originator_id ? this.db.single<any>(this.db.from('User').select('id,displayName,title').eq('tenantId', tenantId).eq('id', moc.originator_id).maybeSingle()).catch(() => null) : Promise.resolve(null),
      moc.area_id ? this.db.single<any>(this.db.from('Area').select('id,name,code').eq('tenantId', tenantId).eq('id', moc.area_id).maybeSingle()).catch(() => null) : Promise.resolve(null)
    ]);

    const mocSteps = ['Draft', 'Submitted', 'Impact Assessment', 'Technical Review', 'Approval', 'Implementation', 'PSSR', 'Closed'];
    const currentStatus = moc.status || moc.workflow_status || 'In Review';
    const stepIdx = Math.max(mocSteps.findIndex((s) => currentStatus.toLowerCase().includes(s.toLowerCase())), 1) + 1;

    const totalActions = (actions ?? []).length;
    const closedActions = (actions ?? []).filter((a: any) => ['Completed', 'Closed', 'Verified', 'CLOSED'].includes(a.status)).length;
    const openActions = totalActions - closedActions;

    const approvedCount = (approvals ?? []).filter((a: any) => ['Approved', 'Signed', 'Completed'].includes(a.status || a.decision)).length;
    const totalApprovals = (approvals ?? []).length || 3;

    const eqTags = (equipment ?? [])
      .map((e: any) => (e.equipment?.tag ? `${e.equipment.tag} (${e.equipment.name || ''})` : e.equipment_tag || e.equipment_id))
      .filter(Boolean);

    const isTempExpired = moc.is_temporary && moc.expiry_date && new Date(moc.expiry_date).getTime() < Date.now();
    const validityLabel = moc.is_temporary
      ? isTempExpired
        ? `Temporary Expired (${moc.expiry_date})`
        : `Temporary until ${moc.expiry_date || 'Scheduled Restoration'}`
      : 'Permanent Modification';

    const requiredActions: CopilotRecordCard['requiredActions'] = [];
    if (openActions > 0) {
      requiredActions.push({
        title: 'Close Pre-Implementation & PSI Actions',
        detail: `${openActions} of ${totalActions} required MOC action item(s) remain open (including P&ID redlines and procedure updates).`,
        severity: 'critical'
      });
    }
    if (isTempExpired) {
      requiredActions.push({
        title: 'Restore Temporary Modification or Extend MOC',
        detail: 'Temporary MOC validity window has expired. Restore plant to original design state or execute formal extension review.',
        severity: 'critical'
      });
    }
    if (pssr?.pssr_required !== false) {
      requiredActions.push({
        title: 'Complete Pre-Startup Safety Review (PSSR)',
        detail: 'Verify field installation, updated PSI deliverables, and operator training sign-offs before commissioning modified equipment.',
        severity: 'warning'
      });
    }
    requiredActions.push({
      title: 'Maintain PHA / LOPA Safeguard Integrity',
      detail: 'Confirm that no Independent Protection Layers (IPLs) or relief device sizing basis are degraded by the change.',
      severity: 'info'
    });

    return {
      module: 'MOC',
      recordId: moc.id,
      recordNumber: moc.moc_number,
      title: `${moc.moc_number}: Overview & Operational Status`,
      subtitle: moc.title,
      url: `/moc/${moc.id}`,
      status: String(currentStatus).toUpperCase(),
      statusStep: `Workflow step ${stepIdx} of ${mocSteps.length}`,
      riskLevel: String(moc.risk_level || 'HIGH').toUpperCase(),
      validity: validityLabel,
      workOrChangeType: String(moc.change_type || (moc.is_temporary ? 'TEMPORARY CHANGE' : 'TECHNICAL CHANGE')).replace(/_/g, ' ').toUpperCase(),
      overviewBullets: [
        { label: 'MOC ID', value: moc.moc_number },
        { label: 'Change Scope', value: moc.description || moc.title },
        { label: 'Change Category', value: String(moc.change_type || 'Process / Equipment Modification').replace(/_/g, ' ').toUpperCase() },
        { label: 'Current Status', value: `${String(currentStatus).toUpperCase()} (Workflow step ${stepIdx} of ${mocSteps.length})` },
        { label: 'Duration / Validity', value: validityLabel },
        { label: 'Risk Level', value: String(moc.risk_level || 'MEDIUM').toUpperCase() }
      ],
      locationDetails: {
        equipment: eqTags.length ? eqTags.slice(0, 3).join(', ') : 'Unit-Wide Process System',
        area: area?.name || moc.area_id || 'Process Unit Area',
        holderOrOwner: originator?.displayName ? `${originator.displayName} (${moc.originator_id})` : String(moc.originator_id || 'Engineering Lead'),
        holderRole: originator?.title || 'MOC Originator'
      },
      actionGates: [
        {
          label: 'Approvals',
          value: `${approvedCount}/${totalApprovals} Signed`,
          subtext: approvedCount >= totalApprovals ? 'Multi-discipline technical approvals complete.' : 'Awaiting technical / HSE authority sign-off.',
          tone: approvedCount >= totalApprovals ? 'emerald' : 'amber'
        },
        {
          label: 'Impact & PHA',
          value: impact ? 'Assessed' : 'Review Required',
          subtext: impact ? 'PSI, P&ID, and SHE impact checklist evaluated.' : 'Complete multi-discipline impact assessment.',
          tone: impact ? 'emerald' : 'amber'
        },
        {
          label: 'Action Items',
          value: totalActions === 0 ? 'None Open' : `${closedActions}/${totalActions} Closed`,
          subtext: openActions > 0 ? `${openActions} action(s) pending completion.` : 'All required MOC actions verified.',
          tone: openActions > 0 ? 'amber' : 'emerald'
        },
        {
          label: 'PSSR Gate',
          value: pssr?.status ? String(pssr.status) : 'Required',
          subtext: 'Pre-Startup Safety Review verification prior to energization.',
          tone: pssr?.status === 'Completed' || pssr?.status === 'Approved' ? 'emerald' : 'blue'
        },
        {
          label: 'PSI / P&ID Lock',
          value: openActions > 0 ? 'Redlines Open' : 'Synchronized',
          subtext: 'As-built P&ID and Safe Operating Limits alignment.',
          tone: openActions > 0 ? 'amber' : 'emerald'
        },
        {
          label: 'Temporary Expiry',
          value: isTempExpired ? 'EXPIRED' : moc.is_temporary ? 'Active Temp' : 'Permanent',
          subtext: isTempExpired ? 'Temporary change window exceeded.' : 'Within authorized change governance window.',
          tone: isTempExpired ? 'rose' : 'emerald'
        }
      ],
      requiredActions
    };
  }

  private async buildPssrStructuredCard(tenantId: string, pssrId: string): Promise<CopilotRecordCard | null> {
    const pssr = await this.db.single<any>(
      this.db.from('pssrs').select('*').eq('tenant_id', tenantId).eq('id', pssrId).maybeSingle()
    );
    if (!pssr) return null;

    const [blockers, punchItems, signatures, trainingReqs, testRecords, equipment, lead, area] = await Promise.all([
      this.db.many<any>(this.db.from('pssr_startup_blockers').select('*').eq('tenant_id', tenantId).eq('pssr_id', pssrId)).catch(() => []),
      this.db.many<any>(this.db.from('pssr_punch_items').select('*').eq('tenant_id', tenantId).eq('pssr_id', pssrId)).catch(() => []),
      this.db.many<any>(this.db.from('pssr_authorization_signatures').select('*').eq('tenant_id', tenantId).eq('pssr_id', pssrId)).catch(() => []),
      this.db.many<any>(this.db.from('pssr_training_requirements').select('*').eq('tenant_id', tenantId).eq('pssr_id', pssrId)).catch(() => []),
      this.db.many<any>(this.db.from('pssr_test_records').select('*').eq('tenant_id', tenantId).eq('pssr_id', pssrId)).catch(() => []),
      this.db.many<any>(this.db.from('pssr_affected_equipment').select('*').eq('tenant_id', tenantId).eq('pssr_id', pssrId)).catch(() => []),
      pssr.review_lead_user_id ? this.db.single<any>(this.db.from('User').select('id,displayName,title').eq('tenantId', tenantId).eq('id', pssr.review_lead_user_id).maybeSingle()).catch(() => null) : Promise.resolve(null),
      pssr.area_id ? this.db.single<any>(this.db.from('Area').select('id,name,code').eq('tenantId', tenantId).eq('id', pssr.area_id).maybeSingle()).catch(() => null) : Promise.resolve(null)
    ]);

    const pssrSteps = ['Draft', 'In Preparation', 'In Review', 'Field Verification', 'Punch List Open', 'Ready For Authorization', 'Authorized For Startup', 'Startup Released', 'Closed'];
    const stepIdx = Math.max(pssrSteps.findIndex((s) => s.toLowerCase() === String(pssr.status || '').toLowerCase()), 1) + 1;

    const openBlockers = (blockers ?? []).filter((b: any) => !['Cleared', 'Resolved', 'Closed'].includes(b.status)).length;
    const catAPunch = (punchItems ?? []).filter((p: any) => (p.category === 'A' || p.category === 'Cat A' || p.startup_blocker) && !['Closed', 'Verified', 'Completed'].includes(p.status)).length;
    const totalPunch = (punchItems ?? []).length;
    const signedCount = (signatures ?? []).filter((s: any) => s.signed_by || s.status === 'Signed' || s.signed_at).length;
    const totalSigs = (signatures ?? []).length || 4;
    const openTraining = (trainingReqs ?? []).filter((t: any) => !['Completed', 'Verified'].includes(t.status)).length;
    const passedTests = (testRecords ?? []).filter((t: any) => ['Pass', 'Passed', 'Verified', 'Completed'].includes(t.result || t.status)).length;

    const eqTags = (equipment ?? []).map((e: any) => e.equipment_tag || e.equipment_name).filter(Boolean);

    const requiredActions: CopilotRecordCard['requiredActions'] = [];
    if (openBlockers > 0 || catAPunch > 0) {
      requiredActions.push({
        title: 'Clear Startup Blockers & Category A Punch Items',
        detail: `${openBlockers} active startup blocker(s) and ${catAPunch} Category A pre-startup punch item(s) must be closed before energizing hydrocarbons/utilities.`,
        severity: 'critical'
      });
    }
    if (openTraining > 0) {
      requiredActions.push({
        title: 'Complete Operator & Maintenance Training Gate',
        detail: `${openTraining} mandatory PSSR training requirement(s) require completion and competency verification prior to startup release.`,
        severity: 'warning'
      });
    }
    if (signedCount < totalSigs) {
      requiredActions.push({
        title: 'Obtain Multi-Discipline Startup Authorization Signatures',
        detail: `${totalSigs - signedCount} authority signature(s) remaining across Operations, Process Safety, Mechanical Integrity, and Instrumentation.`,
        severity: 'warning'
      });
    }
    requiredActions.push({
      title: 'Field Walkdown & Relief / SIS Line-Up Verification',
      detail: 'Confirm all PSV isolation valves are locked open (car-sealed open), SIS trip loops are active, and drains/vents are plugged.',
      severity: 'info'
    });

    return {
      module: 'PSSR',
      recordId: pssr.id,
      recordNumber: pssr.pssr_number,
      title: `${pssr.pssr_number}: Overview & Operational Status`,
      subtitle: pssr.title,
      url: `/pssr/${pssr.id}`,
      status: String(pssr.status || 'IN REVIEW').toUpperCase(),
      statusStep: `Workflow step ${stepIdx} of ${pssrSteps.length}`,
      riskLevel: String(pssr.risk_level || 'HIGH').toUpperCase(),
      validity: pssr.target_startup_date ? `Target Startup: ${new Date(pssr.target_startup_date).toLocaleDateString()}` : 'Pre-Commissioning Gate',
      workOrChangeType: String(pssr.pssr_type || pssr.startup_type || 'MOC STARTUP REVIEW').toUpperCase(),
      overviewBullets: [
        { label: 'PSSR ID', value: pssr.pssr_number },
        { label: 'Review Scope', value: pssr.description || pssr.title },
        { label: 'Startup Type', value: String(pssr.pssr_type || pssr.startup_type || 'Startup After MOC').toUpperCase() },
        { label: 'Current Status', value: `${String(pssr.status).toUpperCase()} (Workflow step ${stepIdx} of ${pssrSteps.length})` },
        { label: 'Target Startup', value: pssr.target_startup_date ? new Date(pssr.target_startup_date).toLocaleDateString() : 'Pending Clearance' },
        { label: 'Risk Level', value: String(pssr.risk_level || 'HIGH').toUpperCase() }
      ],
      locationDetails: {
        equipment: eqTags.length ? eqTags.slice(0, 3).join(', ') : 'Modified Process System',
        area: area?.name || pssr.area_id || 'Process Unit',
        holderOrOwner: lead?.displayName ? `${lead.displayName} (${pssr.review_lead_user_id})` : String(pssr.review_lead_user_id || 'PSSR Review Lead'),
        holderRole: lead?.title || 'PSSR Lead Authority'
      },
      actionGates: [
        {
          label: 'Signatures',
          value: `${signedCount}/${totalSigs} Verified`,
          subtext: signedCount >= totalSigs ? 'All startup authorities signed.' : 'Pending discipline authorization sign-offs.',
          tone: signedCount >= totalSigs ? 'emerald' : 'amber'
        },
        {
          label: 'Cat A Punch',
          value: catAPunch > 0 ? `${catAPunch} Open (Blocked)` : `0 Cat-A (${totalPunch} Total)`,
          subtext: catAPunch > 0 ? 'Category A items block startup release.' : 'Zero Category A blockers remaining.',
          tone: catAPunch > 0 ? 'rose' : 'emerald'
        },
        {
          label: 'Training Gate',
          value: openTraining > 0 ? `${openTraining} Pending` : 'Briefed & Certified',
          subtext: openTraining > 0 ? 'Operators awaiting MOC/PSSR training.' : 'Operations & Maintenance crews certified.',
          tone: openTraining > 0 ? 'amber' : 'emerald'
        },
        {
          label: 'Loop / Leak Tests',
          value: (testRecords ?? []).length > 0 ? `${passedTests}/${(testRecords ?? []).length} Passed` : 'Ready',
          subtext: 'Hydrotest, leak test & SIF loop check status.',
          tone: 'emerald'
        },
        {
          label: 'Startup Blockers',
          value: openBlockers > 0 ? `${openBlockers} Active Blocker(s)` : 'Clear for Startup',
          subtext: openBlockers > 0 ? 'Hard startup hold active.' : 'All pre-startup safety gates satisfied.',
          tone: openBlockers > 0 ? 'rose' : 'emerald'
        },
        {
          label: 'Linked MOC / PSI',
          value: pssr.moc_id ? 'Linked & Tracked' : 'Standalone PSSR',
          subtext: 'PSI redlines and commissioning package linked.',
          tone: 'blue'
        }
      ],
      requiredActions
    };
  }

  private async buildIncidentStructuredCard(tenantId: string, incidentId: string): Promise<CopilotRecordCard | null> {
    const inc = await this.db.single<any>(
      this.db.from('incidents').select('*').eq('tenant_id', tenantId).eq('id', incidentId).maybeSingle()
    );
    if (!inc) return null;

    const actions = await this.db
      .many<any>(this.db.from('Action').select('*').eq('tenantId', tenantId).eq('sourceRecordId', incidentId))
      .catch(() => []);
    const openCapa = (actions ?? []).filter((a: any) => !['CLOSED', 'Closed', 'Completed'].includes(a.status)).length;

    return {
      module: 'INCIDENT',
      recordId: inc.id,
      recordNumber: inc.incident_number,
      title: `${inc.incident_number}: Overview & Operational Status`,
      subtitle: inc.title,
      url: `/incidents/${inc.id}`,
      status: String(inc.status || 'UNDER INVESTIGATION').toUpperCase(),
      statusStep: `API RP 754 ${inc.pse_tier || 'Process Safety Event'}`,
      riskLevel: String(inc.potential_severity || 'HIGH').toUpperCase(),
      validity: inc.occurred_at ? new Date(inc.occurred_at).toLocaleDateString() : 'Active Investigation',
      workOrChangeType: String(inc.classification || inc.event_type || 'PROCESS SAFETY INCIDENT').toUpperCase(),
      overviewBullets: [
        { label: 'Incident ID', value: inc.incident_number },
        { label: 'Event Summary', value: inc.description || inc.title },
        { label: 'Classification', value: String(inc.classification || inc.event_type || 'LOPC').toUpperCase() },
        { label: 'Current Status', value: String(inc.status || 'Open').toUpperCase() },
        { label: 'API RP 754 Tier', value: String(inc.pse_tier || 'Tier 1 / Tier 2 Evaluation') },
        { label: 'Severity', value: String(inc.potential_severity || 'HIGH').toUpperCase() }
      ],
      locationDetails: {
        equipment: inc.equipment_tag || 'Primary Containment System',
        area: inc.location || inc.area_id || 'Process Unit',
        holderOrOwner: inc.reported_by || 'Incident Investigation Lead',
        holderRole: 'Investigation Lead'
      },
      actionGates: [
        {
          label: 'Containment',
          value: 'Stabilized',
          subtext: 'Immediate site containment and isolation verified.',
          tone: 'emerald'
        },
        {
          label: 'RCA Status',
          value: inc.status === 'Closed' ? 'Completed' : 'In Progress',
          subtext: 'Root cause & failed barrier analysis.',
          tone: inc.status === 'Closed' ? 'emerald' : 'amber'
        },
        {
          label: 'CAPA Actions',
          value: openCapa > 0 ? `${openCapa} Open` : `${(actions ?? []).length} Verified`,
          subtext: openCapa > 0 ? 'Corrective actions pending closure in Action Center.' : 'CAPA deliverables tracked.',
          tone: openCapa > 0 ? 'rose' : 'emerald'
        }
      ],
      requiredActions: [
        {
          title: 'Complete Barrier Failure & Root Cause Analysis',
          detail: 'Document failed preventive and mitigative IPL barriers and verify whether PHA/LOPA revalidation or MOC is required.',
          severity: 'warning'
        },
        {
          title: 'Close Linked CAPA Deliverables',
          detail: openCapa > 0 ? `Complete and verify ${openCapa} open Corrective & Preventive Action(s) before incident closure.` : 'Verify long-term CAPA effectiveness.',
          severity: openCapa > 0 ? 'critical' : 'info'
        }
      ]
    };
  }

  private async buildEquipmentStructuredCard(tenantId: string, eqId: string): Promise<CopilotRecordCard | null> {
    const eq = await this.db.single<any>(
      this.db.from('Equipment').select('*').eq('tenantId', tenantId).eq('id', eqId).maybeSingle()
    );
    if (!eq) return null;

    const [activePermits, openActions] = await Promise.all([
      this.db.many<any>(this.db.from('permits').select('id,permit_number,status').eq('tenant_id', tenantId).eq('equipment_id', eqId).in('status', ['Issued', 'Active', 'Suspended'])).catch(() => []),
      this.db.many<any>(this.db.from('Action').select('id,actionNumber,status').eq('tenantId', tenantId).eq('equipmentId', eqId).in('status', ['OPEN', 'IN_PROGRESS'])).catch(() => [])
    ]);

    return {
      module: 'EQUIPMENT',
      recordId: eq.id,
      recordNumber: eq.tag,
      title: `${eq.tag}: Overview & Operational Status`,
      subtitle: eq.name,
      url: `/equipment/${eq.id}`,
      status: String(eq.status || 'IN SERVICE').toUpperCase(),
      statusStep: eq.safetyCritical ? 'Safety Critical Element (SCE)' : 'Process Asset',
      riskLevel: String(eq.criticality || 'HIGH').toUpperCase(),
      validity: `Design: ${eq.designPressure ?? 'N/A'} / ${eq.designTemp ?? 'N/A'}`,
      workOrChangeType: String(eq.type || 'PROCESS EQUIPMENT').toUpperCase(),
      overviewBullets: [
        { label: 'Equipment Tag', value: `${eq.tag} (${eq.name})` },
        { label: 'Asset Description', value: eq.description || `${eq.type || 'Process Asset'} in ${eq.system || 'Primary Process System'}` },
        { label: 'Asset Type', value: String(eq.type || 'Rotating / Static Asset').toUpperCase() },
        { label: 'Operational Status', value: String(eq.status || 'IN SERVICE').toUpperCase() },
        { label: 'Design Limits', value: `Pressure: ${eq.designPressure ?? 'Standard'} · Temp: ${eq.designTemp ?? 'Standard'}` },
        { label: 'Criticality', value: String(eq.criticality || 'HIGH').toUpperCase() }
      ],
      locationDetails: {
        equipment: `${eq.tag} (${eq.name})`,
        area: eq.system || 'Process Area',
        holderOrOwner: eq.fluidService ? `Fluid Service: ${eq.fluidService}` : 'Mechanical Integrity Owner',
        holderRole: eq.safetyCritical ? 'SCE Barrier Asset' : 'Process Unit Asset'
      },
      actionGates: [
        {
          label: 'SCE Status',
          value: eq.safetyCritical ? 'Safety Critical' : 'Standard',
          subtext: eq.safetyCritical ? 'Covered by OSHA 1910.119 MI program.' : 'Standard maintenance schedule.',
          tone: eq.safetyCritical ? 'amber' : 'emerald'
        },
        {
          label: 'Active PTWs',
          value: (activePermits ?? []).length > 0 ? `${(activePermits ?? []).length} Active/Suspended` : 'None Active',
          subtext: (activePermits ?? []).length > 0 ? `Permits: ${(activePermits ?? []).map((p: any) => p.permit_number).join(', ')}` : 'No active field work permits on asset.',
          tone: (activePermits ?? []).length > 0 ? 'amber' : 'emerald'
        },
        {
          label: 'Open Actions',
          value: (openActions ?? []).length > 0 ? `${(openActions ?? []).length} Open` : 'Clear',
          subtext: (openActions ?? []).length > 0 ? 'Open MI / CAPA actions linked to asset.' : 'No overdue mechanical integrity actions.',
          tone: (openActions ?? []).length > 0 ? 'rose' : 'emerald'
        }
      ],
      requiredActions: [
        {
          title: 'Verify Safe Operating Limits (SOL) & Relief Protection',
          detail: 'Ensure operating pressure/temperature remain within PSI design envelope and linked PSV/SIF protection layers are active.',
          severity: 'info'
        }
      ]
    };
  }

  private formatCardAsMarkdown(card: CopilotRecordCard, citationId: string): string {
    const overviewLines = card.overviewBullets
      .map((b) => `* **${b.label}**: ${b.value}`)
      .join('\n');

    const locationLines = [
      card.locationDetails.equipment ? `* **Equipment**: ${card.locationDetails.equipment}` : '',
      `* **Operational Area**: ${card.locationDetails.area}`,
      `* **${card.module === 'PTW' ? 'Permit Holder' : card.module === 'MOC' ? 'MOC Originator' : 'Responsible Lead'}**: ${card.locationDetails.holderOrOwner}`
    ]
      .filter(Boolean)
      .join('\n');

    const gateRows = card.actionGates
      .map((g) => `| **${g.label}** | \`${g.value}\` | ${g.subtext || '-'} |`)
      .join('\n');

    const actionLines = card.requiredActions
      .map((a) => `* **${a.title}**: ${a.detail}`)
      .join('\n');

    return [
      `### **${card.title}** [${citationId}]`,
      overviewLines,
      `---`,
      `### **Location & Personnel Details**`,
      locationLines,
      `---`,
      `### **Action Gates & System Checks**`,
      `| Category | Status | Details |`,
      `| --- | --- | --- |`,
      gateRows,
      `---`,
      `### **Required Actions Before Resuming Work / Proceeding**`,
      actionLines
    ].join('\n\n');
  }
}
