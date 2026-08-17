import { Injectable } from "@nestjs/common";
import { AuditService } from "../audit/audit.service";
import { JsonValue } from "../common/types/db.types";
import { SupabaseService } from "../database/supabase.service";

@Injectable()
export class AuditCapaHistoryService {
  constructor(
    private readonly db: SupabaseService,
    private readonly audit: AuditService,
  ) {}

  async write(input: Record<string, any>) {
    const event = {
      company_id: input.tenantId,
      site_id: input.siteId ?? null,
      unit_id: input.unitId ?? null,
      area_id: input.areaId ?? null,
      program_id: input.programId ?? null,
      plan_id: input.planId ?? null,
      execution_id: input.executionId ?? null,
      finding_id: input.findingId ?? null,
      capa_id: input.capaId ?? null,
      capa_action_id: input.capaActionId ?? null,
      action_engine_id: input.actionEngineId ?? null,
      event_type: input.type,
      event_title: input.title,
      event_description: input.description ?? input.title,
      before_value_json: input.before ?? null,
      after_value_json: input.after ?? null,
      actor_user_id: input.actorId,
      source_module: "Audit CAPA / Action Integration",
      source_record_id: input.capaId ?? input.capaActionId ?? input.findingId ?? null,
    };
    await this.db.single(this.db.from("audit_capa_history_events").insert(event).select("id").single());
    await this.audit.write({
      tenantId: input.tenantId,
      actorId: input.actorId,
      action: input.type,
      entityType: "audit_capa",
      ...(input.capaId ? { entityId: input.capaId } : {}),
      ...(input.before ? { before: input.before as JsonValue } : {}),
      ...(input.after ? { after: input.after as JsonValue } : {}),
      metadata: {
        title: input.title,
        findingId: input.findingId ?? null,
        capaActionId: input.capaActionId ?? null,
        actionEngineId: input.actionEngineId ?? null,
      } as JsonValue,
    });
    return event;
  }
}
