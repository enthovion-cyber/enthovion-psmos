import { Injectable } from '@nestjs/common';
import { AuditService } from '../audit/audit.service';
import { JsonValue } from '../common/types/db.types';
import { SupabaseService } from '../database/supabase.service';

export type TenantContextSwitchAuditInput = {
  tenantId: string;
  userId: string;
  eventType: 'COMPANY_SWITCH' | 'SITE_SWITCH' | 'CONTEXT_REFRESH' | 'ACCESS_DENIED';
  companyId?: string | null;
  siteId?: string | null;
  previousCompanyId?: string | null;
  previousSiteId?: string | null;
  reason?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  metadata?: JsonValue;
};

@Injectable()
export class TenantAuditService {
  constructor(
    private readonly db: SupabaseService,
    private readonly audit: AuditService
  ) {}

  async writeContextSwitch(input: TenantContextSwitchAuditInput) {
    const event = await this.db.single<any>(
      this.db.from('UserContextSwitchEvent').insert({
        id: crypto.randomUUID(),
        tenantId: input.tenantId,
        userId: input.userId,
        eventType: input.eventType,
        companyId: input.companyId ?? null,
        siteId: input.siteId ?? null,
        previousCompanyId: input.previousCompanyId ?? null,
        previousSiteId: input.previousSiteId ?? null,
        reason: input.reason ?? null,
        ipAddress: input.ipAddress ?? null,
        userAgent: input.userAgent ?? null,
        metadata: input.metadata ?? null
      }).select().single()
    ).catch(() => null);

    const auditInput = {
      tenantId: input.tenantId,
      actorId: input.userId,
      action: `TENANT_${input.eventType}`,
      entityType: 'UserActiveContext',
      entityId: event?.id ?? input.userId,
      after: {
        companyId: input.companyId ?? null,
        siteId: input.siteId ?? null,
        previousCompanyId: input.previousCompanyId ?? null,
        previousSiteId: input.previousSiteId ?? null,
        reason: input.reason ?? null
      } as JsonValue
    };
    await this.audit.write(input.metadata === undefined ? auditInput : { ...auditInput, metadata: input.metadata });

    return event;
  }
}
