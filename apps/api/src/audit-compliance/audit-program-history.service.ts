import { Injectable } from '@nestjs/common';
import { AuditService } from '../audit/audit.service';
import { JsonValue } from '../common/types/db.types';
import { SupabaseService } from '../database/supabase.service';

@Injectable()
export class AuditProgramHistoryService {
  constructor(private readonly db: SupabaseService, private readonly audit: AuditService) {}

  async write(input: { tenantId: string; actorId?: string; programId?: string | null; siteId?: string | null; unitId?: string | null; areaId?: string | null; type: string; title: string; description?: string; before?: JsonValue; after?: JsonValue; sourceRecordId?: string | null }) {
    const event = {
      id: crypto.randomUUID(),
      company_id: input.tenantId,
      site_id: input.siteId ?? null,
      unit_id: input.unitId ?? null,
      area_id: input.areaId ?? null,
      program_id: input.programId ?? null,
      event_type: input.type,
      event_title: input.title,
      event_description: input.description ?? input.title,
      before_value_json: input.before ?? null,
      after_value_json: input.after ?? null,
      actor_user_id: input.actorId ?? null,
      source_module: 'Audit / Compliance Assurance',
      source_record_id: input.sourceRecordId ?? input.programId ?? null,
      created_at: new Date().toISOString()
    };
    await this.db.single(this.db.from('audit_program_history_events').insert(event).select('id').single()).catch(() => null);
    const auditInput: Parameters<AuditService['write']>[0] = {
      tenantId: input.tenantId,
      action: input.type,
      entityType: 'audit_program',
      metadata: { title: input.title, sourceModule: 'Audit / Compliance Assurance' } as JsonValue
    };
    if (input.actorId) auditInput.actorId = input.actorId;
    if (input.programId) auditInput.entityId = input.programId;
    if (input.before !== undefined) auditInput.before = input.before;
    if (input.after !== undefined) auditInput.after = input.after;
    await this.audit.write(auditInput).catch(() => null);
    return event;
  }
}
