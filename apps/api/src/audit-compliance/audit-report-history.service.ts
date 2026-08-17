import { Injectable } from "@nestjs/common";
import { AuditService } from "../audit/audit.service";
import { JsonValue } from "../common/types/db.types";
import { SupabaseService } from "../database/supabase.service";

@Injectable()
export class AuditReportHistoryService {
  constructor(
    private readonly db: SupabaseService,
    private readonly audit: AuditService,
  ) {}

  async write(input: Record<string, any>) {
    const event = {
      company_id: input.tenantId,
      site_id: input.siteId ?? null,
      report_id: input.reportId ?? null,
      template_id: input.templateId ?? null,
      package_id: input.packageId ?? null,
      job_id: input.jobId ?? null,
      event_type: input.type,
      event_title: input.title,
      event_description: input.description ?? input.title,
      before_value_json: input.before ?? null,
      after_value_json: input.after ?? null,
      actor_user_id: input.actorId ?? null,
      source_module: "Audit Reports / Export",
      source_record_id: input.reportId ?? input.templateId ?? input.packageId ?? input.jobId ?? null,
      correlation_id: input.correlationId ?? null,
      metadata_json: input.metadata ?? {},
    };
    const inserted = await this.db.single<Record<string, any>>(this.db.from("audit_report_history_events").insert(event).select("id").single());
    await this.audit.write({
      tenantId: input.tenantId,
      actorId: input.actorId,
      action: input.type,
      entityType: "audit_report",
      ...(event.source_record_id ? { entityId: event.source_record_id } : {}),
      ...(input.before ? { before: input.before as JsonValue } : {}),
      ...(input.after ? { after: input.after as JsonValue } : {}),
      metadata: {
        title: input.title,
        reportId: input.reportId ?? null,
        templateId: input.templateId ?? null,
        packageId: input.packageId ?? null,
        jobId: input.jobId ?? null,
      } as JsonValue,
    });
    return { ...event, id: inserted.id };
  }
}
