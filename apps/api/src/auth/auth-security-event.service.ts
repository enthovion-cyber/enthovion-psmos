import { Injectable } from '@nestjs/common';
import { AuditService } from '../audit/audit.service';
import { JsonValue } from '../common/types/db.types';
import { SupabaseService } from '../database/supabase.service';

export type AuthSecurityEventInput = {
  tenantId?: string | null | undefined;
  userId?: string | null | undefined;
  companyId?: string | null | undefined;
  siteId?: string | null | undefined;
  eventType: string;
  email?: string | null | undefined;
  provider?: string | null | undefined;
  success: boolean;
  failureReason?: string | null | undefined;
  ipAddress?: string | null | undefined;
  userAgent?: string | null | undefined;
  metadata?: JsonValue | undefined;
};

@Injectable()
export class AuthSecurityEventService {
  constructor(private readonly db: SupabaseService, private readonly audit: AuditService) {}

  async record(input: AuthSecurityEventInput) {
    const tenantId = input.tenantId ?? 'system';
    const event = {
      id: crypto.randomUUID(),
      tenant_id: input.tenantId ?? null,
      user_id: input.userId ?? null,
      company_id: input.companyId ?? null,
      site_id: input.siteId ?? null,
      event_type: input.eventType,
      email: input.email?.toLowerCase() ?? null,
      provider: input.provider ?? null,
      success: input.success,
      failure_reason: input.failureReason ?? null,
      ip_address: input.ipAddress ?? null,
      user_agent: input.userAgent ?? null,
      metadata_json: input.metadata ?? null
    };
    await this.db.single(this.db.from('auth_security_events').insert(event).select().single()).catch(() => null);
    if (input.userId && input.tenantId) {
      await this.db.single(this.db.from('UserSecurityEvent').insert({
        id: crypto.randomUUID(),
        tenantId: input.tenantId,
        userId: input.userId,
        eventType: input.eventType,
        description: input.failureReason ?? input.eventType,
        ipAddress: input.ipAddress ?? null,
        userAgent: input.userAgent ?? null,
        metadata: input.metadata ?? null
      }).select().single()).catch(() => null);
    }
    await this.audit.write({
      tenantId,
      ...(input.userId ? { actorId: input.userId } : {}),
      action: input.eventType,
      entityType: 'Auth',
      ...(input.userId ? { entityId: input.userId } : {}),
      after: { success: input.success, email: input.email ? '[redacted-email]' : null, provider: input.provider ?? null, failureReason: input.failureReason ?? null } as JsonValue,
      metadata: { companyId: input.companyId ?? null, siteId: input.siteId ?? null } as JsonValue
    }).catch(() => null);
    return event;
  }
}
