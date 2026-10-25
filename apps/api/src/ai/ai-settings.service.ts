import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../database/supabase.service';
import { AiAuditService } from './ai-audit.service';
import { RequestUser } from '../common/decorators/current-user.decorator';

export type AiSettingsDto = {
  enabled: boolean;
  approvedModels: string[];
  retentionDays: number;
  provider: string;
  updatedAt?: string;
};

export type UpdateAiSettingsInput = {
  enabled?: boolean;
  approvedModels?: string[];
  retentionDays?: number;
};

export type AiAuditLogQuery = {
  limit?: number | undefined;
  offset?: number | undefined;
  kind?: string | undefined;
};

@Injectable()
export class AiSettingsService {
  constructor(
    private readonly db: SupabaseService,
    private readonly audit: AiAuditService
  ) {}

  async getSettings(tenantId: string): Promise<AiSettingsDto> {
    const row = await this.db.single<{
      tenantId: string;
      enabled: boolean;
      approvedModels: string[];
      retentionDays: number;
      updatedAt: string;
    } | null>(
      this.db.from('AiSetting').select('*').eq('tenantId', tenantId).maybeSingle()
    );

    if (!row) {
      return {
        enabled: false,
        approvedModels: ['gpt-4o', 'claude-3-5-sonnet', 'gemini-1.5-pro'],
        retentionDays: 365,
        provider: process.env.AI_PROVIDER ?? 'disabled'
      };
    }

    return {
      enabled: Boolean(row.enabled),
      approvedModels: Array.isArray(row.approvedModels) ? row.approvedModels : [],
      retentionDays: Number(row.retentionDays) || 365,
      provider: process.env.AI_PROVIDER ?? 'disabled',
      updatedAt: row.updatedAt
    };
  }

  async updateSettings(user: RequestUser, input: UpdateAiSettingsInput): Promise<AiSettingsDto> {
    const current = await this.getSettings(user.tenantId);
    
    const updatePayload = {
      tenantId: user.tenantId,
      enabled: input.enabled !== undefined ? Boolean(input.enabled) : current.enabled,
      approvedModels: input.approvedModels !== undefined ? input.approvedModels : current.approvedModels,
      retentionDays: input.retentionDays !== undefined ? Number(input.retentionDays) : current.retentionDays,
      updatedAt: new Date().toISOString()
    };

    const saved = await this.db.single<{
      tenantId: string;
      enabled: boolean;
      approvedModels: string[];
      retentionDays: number;
      updatedAt: string;
    }>(
      this.db.from('AiSetting').upsert(updatePayload).select().single()
    );

    await this.audit.record({
      tenantId: user.tenantId,
      siteId: user.activeSiteId ?? null,
      userId: user.id,
      kind: 'ai.settings.update',
      request: input,
      response: saved
    });

    return {
      enabled: Boolean(saved.enabled),
      approvedModels: Array.isArray(saved.approvedModels) ? saved.approvedModels : [],
      retentionDays: Number(saved.retentionDays) || 365,
      provider: process.env.AI_PROVIDER ?? 'disabled',
      updatedAt: saved.updatedAt
    };
  }

  async getAuditLogs(tenantId: string, query: AiAuditLogQuery) {
    const limit = Math.min(Math.max(query.limit ?? 25, 1), 100);
    const offset = Math.max(query.offset ?? 0, 0);

    let dbQuery = this.db
      .from('AiAuditEvent')
      .select('id, tenantId, siteId, userId, kind, model, promptVersion, sourceIds, prevHash, hash, createdAt')
      .eq('tenantId', tenantId)
      .order('createdAt', { ascending: false })
      .range(offset, offset + limit - 1);

    if (query.kind) {
      dbQuery = dbQuery.eq('kind', query.kind);
    }

    const rows = await this.db.many<any>(dbQuery);
    return {
      items: rows,
      limit,
      offset
    };
  }
}
