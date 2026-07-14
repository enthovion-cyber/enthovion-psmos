import { Injectable } from '@nestjs/common';
import { AuditService } from '../audit/audit.service';
import { JsonValue } from '../common/types/db.types';
import { SupabaseService } from '../database/supabase.service';
import { BillingRequestMeta } from './billing.types';

@Injectable()
export class BillingAuditService {
  constructor(private readonly db: SupabaseService, private readonly audit: AuditService) {}

  async write(input: {
    tenantId: string;
    companyId?: string | null | undefined;
    actorUserId?: string | null | undefined;
    action: string;
    targetType: string;
    targetId?: string | null | undefined;
    before?: JsonValue | undefined;
    after?: JsonValue | undefined;
    providerEventId?: string | null | undefined;
    meta?: BillingRequestMeta | undefined;
  }) {
    const event = {
      id: crypto.randomUUID(),
      company_id: input.companyId ?? null,
      actor_user_id: input.actorUserId ?? null,
      action: input.action,
      target_type: input.targetType,
      target_id: input.targetId ?? null,
      before_value_json: input.before ?? null,
      after_value_json: input.after ?? null,
      provider_event_id: input.providerEventId ?? null,
      ip_address: input.meta?.ip ?? null,
      user_agent: input.meta?.userAgent ?? null
    };
    await this.db.single(this.db.from('billing_audit_events').insert(event).select().single()).catch(() => null);
    await this.audit.write({
      tenantId: input.tenantId,
      ...(input.actorUserId ? { actorId: input.actorUserId } : {}),
      action: input.action,
      entityType: input.targetType,
      ...(input.targetId ? { entityId: input.targetId } : {}),
      ...(input.before !== undefined ? { before: input.before } : {}),
      ...(input.after !== undefined ? { after: input.after } : {}),
      metadata: { companyId: input.companyId ?? null, providerEventId: input.providerEventId ?? null } as JsonValue
    }).catch(() => null);
    return event;
  }
}
