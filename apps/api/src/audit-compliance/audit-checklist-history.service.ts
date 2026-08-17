import { Injectable } from "@nestjs/common";
import { AuditService } from "../audit/audit.service";
import { JsonValue } from "../common/types/db.types";
import { SupabaseService } from "../database/supabase.service";

@Injectable()
export class AuditChecklistHistoryService {
  constructor(
    private readonly db: SupabaseService,
    private readonly audit: AuditService,
  ) {}

  async write(input: {
    tenantId: string;
    actorId: string;
    checklistId?: string | null;
    siteId?: string | null;
    sectionId?: string | null;
    itemId?: string | null;
    questionBankId?: string | null;
    programId?: string | null;
    planId?: string | null;
    type: string;
    title: string;
    description?: string;
    before?: JsonValue;
    after?: JsonValue;
  }) {
    const event = {
      company_id: input.tenantId,
      site_id: input.siteId ?? null,
      checklist_id: input.checklistId ?? null,
      section_id: input.sectionId ?? null,
      item_id: input.itemId ?? null,
      question_bank_id: input.questionBankId ?? null,
      program_id: input.programId ?? null,
      plan_id: input.planId ?? null,
      event_type: input.type,
      event_title: input.title,
      event_description: input.description ?? input.title,
      before_value_json: input.before ?? null,
      after_value_json: input.after ?? null,
      actor_user_id: input.actorId,
      source_module: "Audit Checklist Builder",
      source_record_id: input.checklistId ?? input.questionBankId ?? null,
    };
    await this.db
      .single(
        this.db
          .from("audit_checklist_history_events")
          .insert(event)
          .select("id")
          .single(),
      )
      .catch(() => null);
    await this.audit
      .write({
        tenantId: input.tenantId,
        actorId: input.actorId,
        action: input.type,
        entityType: "audit_checklist",
        ...(input.checklistId ? { entityId: input.checklistId } : {}),
        ...(input.before !== undefined ? { before: input.before } : {}),
        ...(input.after !== undefined ? { after: input.after } : {}),
        metadata: {
          title: input.title,
          sourceModule: "Audit Checklist Builder",
        } as JsonValue,
      })
      .catch(() => null);
    return event;
  }
}
