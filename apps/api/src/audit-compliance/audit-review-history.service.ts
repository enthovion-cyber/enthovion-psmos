import { Injectable } from "@nestjs/common";
import { AuditService } from "../audit/audit.service";
import { JsonValue } from "../common/types/db.types";
import { SupabaseService } from "../database/supabase.service";

@Injectable()
export class AuditReviewHistoryService {
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
      approval_id: input.approvalId ?? null,
      rule_id: input.ruleId ?? null,
      source_module: input.sourceModule ?? null,
      source_record_type: input.sourceRecordType ?? null,
      source_record_id: input.sourceRecordId ?? null,
      event_type: input.type,
      event_title: input.title,
      event_description: input.description ?? input.title,
      before_value_json: input.before ?? null,
      after_value_json: input.after ?? null,
      actor_user_id: input.actorId ?? null,
    };
    await this.db.single(this.db.from("audit_approval_history_events").insert(event).select("id").single());
    await this.audit.write({
      tenantId: input.tenantId,
      actorId: input.actorId,
      action: input.type,
      entityType: "audit_review_approval",
      ...(event.approval_id ? { entityId: event.approval_id } : {}),
      ...(input.before ? { before: input.before as JsonValue } : {}),
      ...(input.after ? { after: input.after as JsonValue } : {}),
      metadata: {
        title: input.title,
        sourceModule: input.sourceModule ?? null,
        sourceRecordId: input.sourceRecordId ?? null,
        ruleId: input.ruleId ?? null,
      } as JsonValue,
    });
    return event;
  }
}
