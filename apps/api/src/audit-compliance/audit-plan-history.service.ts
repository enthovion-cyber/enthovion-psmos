import { Injectable } from '@nestjs/common';
import { AuditService } from '../audit/audit.service';
import { JsonValue } from '../common/types/db.types';
import { SupabaseService } from '../database/supabase.service';

@Injectable()
export class AuditPlanHistoryService {
  constructor(private readonly db: SupabaseService, private readonly audit: AuditService) {}

  async write(input: { tenantId: string; actorId: string; planId?: string | null; siteId?: string | null; type: string; title: string; description?: string; before?: JsonValue; after?: JsonValue }) {
    const event = { id: crypto.randomUUID(), company_id: input.tenantId, site_id: input.siteId ?? null, plan_id: input.planId ?? null, event_type: input.type, event_title: input.title, event_description: input.description ?? input.title, before_value_json: input.before ?? null, after_value_json: input.after ?? null, actor_user_id: input.actorId, source_module: 'Audit Plan / Schedule', source_record_id: input.planId ?? null, created_at: new Date().toISOString() };
    await this.db.single(this.db.from('audit_plan_history_events').insert(event).select('id').single()).catch(() => null);
    await this.audit.write({ tenantId: input.tenantId, actorId: input.actorId, action: input.type, entityType: 'audit_plan', ...(input.planId ? { entityId: input.planId } : {}), ...(input.before !== undefined ? { before: input.before } : {}), ...(input.after !== undefined ? { after: input.after } : {}), metadata: { title: input.title, sourceModule: 'Audit Plan / Schedule' } as JsonValue }).catch(() => null);
    return event;
  }
}
