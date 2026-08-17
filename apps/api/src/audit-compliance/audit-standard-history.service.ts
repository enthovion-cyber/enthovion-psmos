import { Injectable } from "@nestjs/common";
import { AuditService } from "../audit/audit.service";
import { JsonValue } from "../common/types/db.types";
import { SupabaseService } from "../database/supabase.service";

@Injectable()
export class AuditStandardHistoryService {
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
      standard_id: input.standardId ?? null,
      clause_id: input.clauseId ?? null,
      mapping_id: input.mappingId ?? null,
      program_id: input.programId ?? null,
      plan_id: input.planId ?? null,
      execution_id: input.executionId ?? null,
      finding_id: input.findingId ?? null,
      capa_id: input.capaId ?? null,
      evidence_id: input.evidenceId ?? null,
      score_run_id: input.scoreRunId ?? null,
      event_type: input.type,
      event_title: input.title,
      event_description: input.description ?? input.title,
      before_value_json: input.before ?? null,
      after_value_json: input.after ?? null,
      actor_user_id: input.actorId,
      source_module: input.sourceModule ?? "Audit Standards Mapping",
      source_record_id: input.sourceRecordId ?? input.mappingId ?? input.standardId ?? input.clauseId ?? null,
    };
    await this.db.single(this.db.from("audit_standard_mapping_history_events").insert(event).select("id").single());
    await this.audit.write({
      tenantId: input.tenantId,
      actorId: input.actorId,
      action: input.type,
      entityType: "audit_standards_mapping",
      ...(event.source_record_id ? { entityId: event.source_record_id } : {}),
      ...(input.before ? { before: input.before as JsonValue } : {}),
      ...(input.after ? { after: input.after as JsonValue } : {}),
      metadata: {
        title: input.title,
        standardId: input.standardId ?? null,
        clauseId: input.clauseId ?? null,
        mappingId: input.mappingId ?? null,
      } as JsonValue,
    });
    return event;
  }
}
