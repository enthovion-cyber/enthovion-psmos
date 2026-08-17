import { Injectable } from "@nestjs/common";
import { AuditService } from "../audit/audit.service";
import { JsonValue } from "../common/types/db.types";
import { SupabaseService } from "../database/supabase.service";

@Injectable()
export class AuditScoringHistoryService {
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
      score_run_id: input.scoreRunId ?? null,
      model_id: input.modelId ?? null,
      event_type: input.type,
      event_title: input.title,
      event_description: input.description ?? input.title,
      before_value_json: input.before ?? null,
      after_value_json: input.after ?? null,
      actor_user_id: input.actorId,
      source_module: "Audit Compliance Scoring",
      source_record_id: input.scoreRunId ?? input.modelId ?? input.sourceRecordId ?? null,
    };
    await this.db.single(this.db.from("audit_score_history_events").insert(event).select("id").single());
    await this.audit.write({
      tenantId: input.tenantId,
      actorId: input.actorId,
      action: input.type,
      entityType: "audit_compliance_scoring",
      ...(input.scoreRunId ? { entityId: input.scoreRunId } : {}),
      ...(input.before ? { before: input.before as JsonValue } : {}),
      ...(input.after ? { after: input.after as JsonValue } : {}),
      metadata: {
        title: input.title,
        modelId: input.modelId ?? null,
        sourceRecordId: input.sourceRecordId ?? null,
      } as JsonValue,
    });
    return event;
  }
}
