import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { RequestUser } from "../common/decorators/current-user.decorator";
import { SupabaseService } from "../database/supabase.service";
import { AuditExecutionHistoryService } from "./audit-execution-history.service";

type Row = Record<string, any>;

const CLOSED_STATUSES = ["Completed", "Cancelled", "Archived"];
const POSITIVE_RESULTS = ["Compliant", "Conforming", "Pass", "Yes", "Satisfactory"];
const NEGATIVE_RESULTS = ["Non-Compliant", "Nonconforming", "Fail", "No", "Unsatisfactory"];

@Injectable()
export class AuditExecutionService {
  constructor(
    private readonly db: SupabaseService,
    private readonly history: AuditExecutionHistoryService,
  ) {}

  async dashboard(user: RequestUser, query: Row = {}) {
    const register = await this.register(user, { ...query, page: 1, limit: 500 });
    const rows = register.rows;
    return {
      summary: register.summary,
      byStatus: this.group(rows, "execution_status"),
      byProgress: this.group(rows, "progress_status"),
      byEvidence: this.group(rows, "evidence_status"),
      inProgress: rows.filter((row: Row) => row.execution_status === "In Progress"),
      pendingEvidence: rows.filter((row: Row) => Number(row.evidence_missing_count ?? 0) > 0),
      fieldFindings: rows.filter((row: Row) => Number(row.field_findings_count ?? 0) > 0),
      recent: rows.slice(0, 10),
    };
  }

  async register(user: RequestUser, query: Row = {}) {
    const page = Math.max(1, Number(query.page ?? 1));
    const limit = Math.min(250, Math.max(1, Number(query.limit ?? 25)));
    let request: any = this.db
      .from("audit_executions")
      .select("*", { count: "exact" })
      .eq("company_id", user.tenantId);

    if (!this.truthy(query.includeArchived)) request = request.is("archived_at", null);
    const scopedSite = query.siteId ?? user.selectedSiteId;
    if (scopedSite && !user.corporateView) {
      this.assertSite(user, scopedSite);
      request = request.eq("site_id", scopedSite);
    } else if (scopedSite) {
      request = request.eq("site_id", scopedSite);
    }
    for (const [inputKey, column] of Object.entries({
      status: "execution_status",
      executionStatus: "execution_status",
      progressStatus: "progress_status",
      evidenceStatus: "evidence_status",
      programId: "program_id",
      planId: "plan_id",
      checklistId: "checklist_id",
      leadAuditorUserId: "lead_auditor_user_id",
      auditType: "audit_type",
      criticality: "criticality",
      mode: "execution_mode",
    })) {
      if (query[inputKey]) request = request.eq(column, query[inputKey]);
    }
    if (query.readyForFindingRegister !== undefined) {
      request = request.eq("ready_for_finding_register", this.truthy(query.readyForFindingRegister));
    }
    if (query.search) {
      const search = String(query.search).replace(/[,%()]/g, " ").trim();
      if (search) request = request.or(`execution_code.ilike.%${search}%,execution_title.ilike.%${search}%`);
    }
    const sort = String(query.sort ?? "updated_at.desc");
    const [sortColumn, direction] = sort.split(".");
    const { data, count, error } = await request
      .order(sortColumn || "updated_at", { ascending: direction === "asc" })
      .range((page - 1) * limit, page * limit - 1);
    if (error) throw new BadRequestException(error.message);
    const rows = data ?? [];
    return { rows, total: count ?? rows.length, page, limit, summary: this.summary(rows) };
  }

  async context(user: RequestUser) {
    const [sites, units, areas, users, plans, checklists, settings] = await Promise.all([
      this.safeRows(this.db.from("Site").select("id,name,tenantId").eq("tenantId", user.tenantId).order("name")),
      this.safeRows(this.db.from("Unit").select("id,name,siteId,tenantId").eq("tenantId", user.tenantId).order("name")),
      this.safeRows(this.db.from("Area").select("id,name,siteId,unitId,tenantId").eq("tenantId", user.tenantId).order("name")),
      this.safeRows(this.db.from("User").select("id,name,email,role,department,isActive,tenantId").eq("tenantId", user.tenantId).order("name")),
      this.safeRows(
        this.db
          .from("audit_plans")
          .select("id,plan_code,plan_title,site_id,program_id,plan_status,checklist_status_foundation,scheduled_start_at,lead_auditor_user_id")
          .eq("company_id", user.tenantId)
          .in("plan_status", ["Approved", "Ready For Checklist", "Ready For Execution Foundation", "Scheduled"]),
      ),
      this.safeRows(
        this.db
          .from("audit_checklist_templates")
          .select("id,checklist_code,checklist_title,checklist_status,readiness_health")
          .eq("company_id", user.tenantId)
          .in("checklist_status", ["Approved", "Active", "Current"]),
      ),
      this.settings(user),
    ]);
    return {
      sites: this.filterSites(user, sites),
      units,
      areas,
      users,
      plans,
      checklists,
      settings,
      lookups: this.lookups(),
    };
  }

  lookups() {
    return {
      executionModes: ["Onsite", "Remote", "Hybrid", "Desktop Review", "Field Verification", "Interview-Based", "Document Review", "System Review"],
      executionStatuses: ["Draft", "Ready To Start", "In Progress", "Paused", "Blocked", "Completed", "Reopened", "Cancelled", "Archived"],
      responseStatuses: ["Not Answered", "Answered", "Needs Evidence", "Needs Comment", "Needs Review", "Reviewed", "Reopened"],
      complianceResults: ["Compliant", "Non-Compliant", "Partially Compliant", "Not Applicable", "Not Verified", "Observation"],
      evidenceTypes: ["Document Control", "Storage File", "Photo", "Interview Record", "Walkthrough Record", "External Reference", "Other"],
      noteTypes: ["General Note", "Observation", "Interview Note", "Walkthrough Note", "Evidence Note", "Potential Finding", "Safety Concern", "Other"],
      findingTypes: ["Non-Compliance", "Observation", "Opportunity for Improvement", "Safety Critical Finding", "Regulatory Finding", "System Weakness", "Repeat Finding", "Other"],
      criticalities: ["Low", "Medium", "High", "Critical", "Safety-Critical", "Regulatory-Critical", "PSM-Critical"],
      readinessStatuses: ["Ready", "Warning", "Blocked"],
    };
  }

  async detail(user: RequestUser, id: string) {
    const execution = await this.execution(user, id);
    const [
      sections,
      items,
      responses,
      evidence,
      notes,
      findings,
      interviews,
      walkthroughs,
      readinessRows,
      activity,
      history,
      validation,
    ] = await Promise.all([
      this.childRows("audit_execution_sections", execution, "section_order"),
      this.childRows("audit_execution_items", execution, "item_order"),
      this.childRows("audit_execution_responses", execution, "updated_at"),
      this.childRows("audit_execution_evidence_links", execution, "created_at"),
      this.childRows("audit_field_notes", execution, "created_at", true),
      this.childRows("audit_field_findings", execution, "created_at"),
      this.childRows("audit_execution_interviews", execution, "created_at"),
      this.childRows("audit_execution_walkthroughs", execution, "created_at"),
      this.childRows("audit_execution_readiness_checks", execution, "checked_at"),
      this.childRows("audit_execution_activity_events", execution, "created_at"),
      this.childRows("audit_execution_history_events", execution, "created_at"),
      this.childRows("audit_execution_validation_results", execution, "validated_at"),
    ]);
    return {
      execution,
      sections,
      items,
      responses,
      evidence,
      notes,
      findings,
      interviews,
      walkthroughs,
      readiness: readinessRows.at(-1) ?? this.computeReadiness(execution, items, responses, evidence, findings),
      validation: validation.at(-1) ?? null,
      activity,
      history,
      progress: this.progressPayload(execution, sections, items, responses, evidence, findings),
    };
  }

  async workspace(user: RequestUser, id: string) {
    return this.detail(user, id);
  }

  async planExecution(user: RequestUser, planId: string) {
    const rows = await this.safeRows(
      this.db
        .from("audit_executions")
        .select("*")
        .eq("company_id", user.tenantId)
        .eq("plan_id", planId)
        .order("updated_at", { ascending: false }),
    );
    const readiness = await this.executionReadinessForPlan(user, planId);
    return { rows, current: rows[0] ?? null, readiness };
  }

  async executionReadinessForPlan(user: RequestUser, planId: string) {
    const plan = await this.single("audit_plans", user, "id", planId);
    if (plan.site_id) this.assertSite(user, plan.site_id);
    const assignments = await this.safeRows(
      this.db
        .from("audit_checklist_assignments")
        .select("*")
        .eq("company_id", user.tenantId)
        .eq("plan_id", planId)
        .is("removed_at", null)
        .order("primary_checklist", { ascending: false }),
    );
    const checklistId = assignments[0]?.checklist_id;
    const blockers: string[] = [];
    const warnings: string[] = [];
    if (!checklistId) blockers.push("Audit plan has no assigned checklist.");
    let checklist: Row | null = null;
    if (checklistId) {
      checklist = await this.safeSingle(
        this.db.from("audit_checklist_templates").select("*").eq("company_id", user.tenantId).eq("id", checklistId).maybeSingle(),
      );
      if (!checklist) blockers.push("Assigned checklist was not found.");
      else if (!["Approved", "Active", "Current", "Ready For Execution"].includes(checklist.checklist_status)) {
        blockers.push("Assigned checklist is not approved/current.");
      }
    }
    if (!plan.lead_auditor_user_id) blockers.push("Lead auditor is missing.");
    if (!plan.site_id) warnings.push("Execution has no site scope.");
    return {
      status: blockers.length ? "Blocked" : warnings.length ? "Warning" : "Ready",
      ready: blockers.length === 0,
      blockers,
      warnings,
      plan,
      checklist,
    };
  }

  async create(user: RequestUser, dto: Row) {
    if (dto.planId) return this.startFromPlan(user, dto.planId, dto);
    const settings = await this.settings(user, dto.siteId ?? user.selectedSiteId ?? null);
    if (settings.require_plan_for_execution && !dto.allowStandaloneOverride) {
      throw new BadRequestException("Company/site policy requires an approved audit plan before execution.");
    }
    if (!dto.checklistId) throw new BadRequestException("Checklist is required for standalone execution.");
    if (!dto.executionTitle || !dto.executionCode || !dto.executionMode) {
      throw new BadRequestException("Execution title, code, and mode are required.");
    }
    const checklist = await this.single("audit_checklist_templates", user, "id", dto.checklistId);
    const sections = await this.checkRows("audit_checklist_sections", user, checklist.id);
    const items = await this.checkRows("audit_checklist_items", user, checklist.id);
    const siteId = dto.siteId ?? user.selectedSiteId ?? null;
    if (siteId) this.assertSite(user, siteId);
    const execution = await this.db.single<Row>(
      this.db
        .from("audit_executions")
        .insert({
          company_id: user.tenantId,
          site_id: siteId,
          unit_id: dto.unitId ?? null,
          area_id: dto.areaId ?? null,
          checklist_id: checklist.id,
          execution_code: dto.executionCode,
          execution_title: dto.executionTitle,
          execution_status: dto.startNow ? "In Progress" : "Ready To Start",
          progress_status: "Not Started",
          evidence_status: "Not Required",
          audit_type: dto.auditType ?? checklist.audit_type ?? null,
          criticality: dto.criticality ?? checklist.criticality ?? null,
          execution_mode: dto.executionMode,
          lead_auditor_user_id: dto.leadAuditorUserId ?? user.id,
          started_by: dto.startNow ? user.id : null,
          started_at: dto.startNow ? new Date().toISOString() : null,
          plan_snapshot_json: {},
          checklist_snapshot_json: { ...checklist, sections, items },
          scope_snapshot_json: dto.scopeSnapshot ?? null,
          team_snapshot_json: dto.teamSnapshot ?? null,
          total_items: items.length,
          pending_items: items.length,
          created_by: user.id,
          updated_by: user.id,
        })
        .select()
        .single(),
    );
    await this.materializeChecklist(user, execution, sections, items);
    await this.event(user, execution, "Execution Created", "Audit execution created", null, execution);
    return this.detail(user, execution.id);
  }

  async startFromPlan(user: RequestUser, planId: string, dto: Row) {
    const readiness = await this.executionReadinessForPlan(user, planId);
    if (!readiness.ready) throw new BadRequestException(readiness.blockers.join(" "));
    const plan = readiness.plan;
    const checklist = readiness.checklist as Row;
    const [scope, team, sections, items] = await Promise.all([
      this.planRows("audit_plan_scopes", user, planId),
      this.planRows("audit_plan_team_members", user, planId),
      this.checkRows("audit_checklist_sections", user, checklist.id),
      this.checkRows("audit_checklist_items", user, checklist.id),
    ]);
    const lead = dto.leadAuditorUserId ?? plan.lead_auditor_user_id;
    if (!dto.executionTitle || !dto.executionCode || !dto.executionMode) {
      throw new BadRequestException("Execution title, code, and mode are required.");
    }
    const execution = await this.db.single<Row>(
      this.db
        .from("audit_executions")
        .insert({
          company_id: user.tenantId,
          site_id: plan.site_id,
          unit_id: dto.unitId ?? plan.unit_id ?? null,
          area_id: dto.areaId ?? plan.area_id ?? null,
          program_id: plan.program_id,
          plan_id: plan.id,
          checklist_id: checklist.id,
          execution_code: dto.executionCode,
          execution_title: dto.executionTitle,
          execution_status: "In Progress",
          progress_status: "Not Started",
          evidence_status: "Not Required",
          audit_type: plan.audit_type,
          criticality: plan.criticality,
          execution_mode: dto.executionMode,
          lead_auditor_user_id: lead,
          started_by: user.id,
          started_at: dto.startAt ?? new Date().toISOString(),
          plan_snapshot_json: plan,
          checklist_snapshot_json: { ...checklist, sections, items },
          scope_snapshot_json: scope,
          team_snapshot_json: team,
          total_items: items.length,
          pending_items: items.length,
          created_by: user.id,
          updated_by: user.id,
        })
        .select()
        .single(),
    );
    await this.materializeChecklist(user, execution, sections, items);
    await this.updatePlanExecutionStatus(user, execution, "In Execution Foundation");
    await this.event(user, execution, "Execution Started", "Audit execution started from scheduled plan", null, execution);
    return this.detail(user, execution.id);
  }

  async update(user: RequestUser, id: string, dto: Row) {
    const before = await this.execution(user, id);
    this.assertEditable(before);
    const patch = this.pick(dto, [
      ["executionTitle", "execution_title"],
      ["executionMode", "execution_mode"],
      ["leadAuditorUserId", "lead_auditor_user_id"],
      ["criticality", "criticality"],
      ["auditType", "audit_type"],
      ["unitId", "unit_id"],
      ["areaId", "area_id"],
    ]);
    if (!Object.keys(patch).length) return this.detail(user, id);
    patch.updated_by = user.id;
    patch.updated_at = new Date().toISOString();
    const after = await this.db.single<Row>(
      this.db.from("audit_executions").update(patch).eq("company_id", user.tenantId).eq("id", id).select().single(),
    );
    await this.event(user, after, "Execution Updated", "Audit execution metadata updated", before, after);
    return this.detail(user, id);
  }

  async transition(user: RequestUser, id: string, action: string, dto: Row = {}) {
    const before = await this.execution(user, id);
    const now = new Date().toISOString();
    const patch: Row = { updated_by: user.id, updated_at: now };
    const requiredReason = ["pause", "reopen", "cancel", "archive"];
    if (requiredReason.includes(action) && !dto.reason) throw new BadRequestException("Reason is required.");
    if (action === "start") {
      if (!["Draft", "Ready To Start", "Paused", "Reopened"].includes(before.execution_status)) throw new BadRequestException("Execution cannot be started from current status.");
      patch.execution_status = "In Progress";
      patch.started_by = before.started_by ?? user.id;
      patch.started_at = before.started_at ?? now;
    } else if (action === "pause") {
      patch.execution_status = "Paused";
      patch.paused_by = user.id;
      patch.paused_at = now;
      patch.pause_reason = dto.reason;
    } else if (action === "resume") {
      patch.execution_status = "In Progress";
      patch.resumed_by = user.id;
      patch.resumed_at = now;
    } else if (action === "complete") {
      const readiness = await this.runReadiness(user, id);
      if (!readiness.ready_for_completion && !dto.overrideReadiness) throw new BadRequestException("Execution is not ready for completion.");
      patch.execution_status = "Completed";
      patch.progress_status = "Complete";
      patch.completed_by = user.id;
      patch.completed_at = now;
      patch.completion_notes = dto.completionNotes ?? dto.reason ?? null;
    } else if (action === "reopen") {
      patch.execution_status = "Reopened";
      patch.reopened_by = user.id;
      patch.reopened_at = now;
      patch.reopen_reason = dto.reason;
    } else if (action === "cancel") {
      patch.execution_status = "Cancelled";
      patch.cancelled_by = user.id;
      patch.cancelled_at = now;
      patch.cancel_reason = dto.reason;
    } else if (action === "archive") {
      patch.execution_status = "Archived";
      patch.archived_by = user.id;
      patch.archived_at = now;
      patch.archive_reason = dto.reason;
    } else {
      throw new BadRequestException("Unsupported execution action.");
    }
    const after = await this.db.single<Row>(
      this.db.from("audit_executions").update(patch).eq("company_id", user.tenantId).eq("id", id).select().single(),
    );
    await this.updatePlanExecutionStatus(user, after, patch.execution_status === "Completed" ? "Completed Foundation" : patch.execution_status);
    await this.event(user, after, `Execution ${this.title(action)}`, `Audit execution ${action}`, before, after);
    return this.detail(user, id);
  }

  async saveResponse(user: RequestUser, executionId: string, itemId: string | undefined, dto: Row, responseId?: string) {
    const execution = await this.execution(user, executionId);
    this.assertEditable(execution);
    const before = responseId ? await this.safeSingle(
      this.db.from("audit_execution_responses").select("*").eq("company_id", user.tenantId).eq("id", responseId).maybeSingle(),
    ) : null;
    const targetItemId = itemId ?? before?.execution_item_id;
    if (!targetItemId) throw new BadRequestException("Execution item is required for response update.");
    const item = await this.item(user, execution, targetItemId);
    const compliance = dto.complianceResult ?? this.inferCompliance(dto.responseStatus ?? dto.responseValue ?? dto.responseText);
    const responseStatus = dto.responseStatus ?? "Answered";
    this.validateResponse(item, { ...dto, complianceResult: compliance, responseStatus });
    const payload = {
      company_id: user.tenantId,
      site_id: execution.site_id,
      execution_id: execution.id,
      execution_section_id: item.execution_section_id,
      execution_item_id: item.id,
      response_value_json: dto.responseValue ?? null,
      response_text: dto.responseText ?? null,
      response_status: responseStatus,
      compliance_result: compliance,
      comment: dto.comment ?? null,
      na_justification: dto.naJustification ?? null,
      evidence_required: Boolean(item.mandatory_evidence || item.attachments_required || dto.evidenceRequired),
      evidence_status: dto.evidenceStatus ?? (item.mandatory_evidence || item.attachments_required ? "Missing" : "Not Required"),
      finding_created: Boolean(dto.findingCreated),
      reviewed_by: dto.reviewedBy ?? null,
      reviewed_at: dto.reviewedAt ?? null,
      review_status: dto.reviewStatus ?? null,
      responded_by: before?.responded_by ?? user.id,
      responded_at: before?.responded_at ?? new Date().toISOString(),
      last_updated_by: user.id,
      updated_at: new Date().toISOString(),
    };
    const saved = responseId
      ? await this.db.single<Row>(this.db.from("audit_execution_responses").update(payload).eq("company_id", user.tenantId).eq("id", responseId).select().single())
      : await this.db.single<Row>(this.db.from("audit_execution_responses").upsert(payload, { onConflict: "execution_id,execution_item_id" }).select().single());
    await this.db.single<Row>(
      this.db
        .from("audit_execution_items")
        .update({ item_status: responseStatus, updated_at: new Date().toISOString() })
        .eq("company_id", user.tenantId)
        .eq("id", item.id)
        .select("id")
        .single(),
    );
    if (NEGATIVE_RESULTS.includes(compliance) && item.safety_critical && item.may_create_finding && dto.createFinding) {
      await this.saveFinding(user, executionId, {
        executionSectionId: item.execution_section_id,
        executionItemId: item.id,
        responseId: saved.id,
        findingTitle: dto.findingTitle ?? `${item.item_code} safety critical non-compliance`,
        findingType: "Safety Critical Finding",
        findingDescription: dto.findingDescription ?? dto.comment ?? item.item_text,
        criticality: item.severity_foundation ?? "Safety-Critical",
        immediateConcern: true,
        stopWorkRecommended: Boolean(dto.stopWorkRecommended),
        evidenceSummary: dto.comment ?? null,
        recommendedAction: dto.recommendedAction ?? null,
      });
    }
    await this.recalculate(user, execution.id);
    await this.event(user, execution, before ? "Response Updated" : "Response Created", `Checklist response saved for ${item.item_code}`, before, saved);
    return this.detail(user, executionId);
  }

  async reopenResponse(user: RequestUser, executionId: string, responseId: string, dto: Row = {}) {
    if (!dto.reason) throw new BadRequestException("Reopen reason is required.");
    const execution = await this.execution(user, executionId);
    this.assertEditable(execution);
    const before = await this.single("audit_execution_responses", user, "id", responseId);
    const after = await this.db.single<Row>(
      this.db
        .from("audit_execution_responses")
        .update({ response_status: "Reopened", review_status: "Reopened", comment: dto.reason, last_updated_by: user.id, updated_at: new Date().toISOString() })
        .eq("company_id", user.tenantId)
        .eq("id", responseId)
        .select()
        .single(),
    );
    await this.recalculate(user, execution.id);
    await this.event(user, execution, "Response Reopened", "Checklist response reopened", before, after);
    return this.detail(user, executionId);
  }

  async completeSection(user: RequestUser, executionId: string, sectionId: string, dto: Row = {}) {
    const execution = await this.execution(user, executionId);
    this.assertEditable(execution);
    const items = await this.safeRows(this.db.from("audit_execution_items").select("*").eq("company_id", user.tenantId).eq("execution_section_id", sectionId));
    const responses = await this.safeRows(this.db.from("audit_execution_responses").select("*").eq("company_id", user.tenantId).eq("execution_section_id", sectionId));
    const missing = items.filter((item) => item.required_response && !responses.some((response) => response.execution_item_id === item.id));
    if (missing.length && !dto.override) throw new BadRequestException("Section has unanswered required items.");
    const before = await this.single("audit_execution_sections", user, "id", sectionId);
    const after = await this.db.single<Row>(
      this.db
        .from("audit_execution_sections")
        .update({ section_status: "Complete", progress_percent: 100, completed_items: items.length, pending_items: 0, updated_at: new Date().toISOString() })
        .eq("company_id", user.tenantId)
        .eq("id", sectionId)
        .select()
        .single(),
    );
    await this.recalculate(user, execution.id);
    await this.event(user, execution, "Section Completed", `Execution section ${before.section_title} completed`, before, after);
    return this.detail(user, executionId);
  }

  async evidence(user: RequestUser, executionId: string, evidenceId?: string) {
    const execution = await this.execution(user, executionId);
    if (evidenceId) return this.single("audit_execution_evidence_links", user, "id", evidenceId);
    return this.childRows("audit_execution_evidence_links", execution, "created_at");
  }

  async saveEvidence(user: RequestUser, executionId: string, dto: Row, evidenceId?: string) {
    const execution = await this.execution(user, executionId);
    this.assertEditable(execution);
    if (!dto.evidenceTitle || !dto.evidenceType) throw new BadRequestException("Evidence title and type are required.");
    if (!dto.documentId && !dto.storageFileId && !dto.relatedRecordId && !dto.externalReference && dto.evidenceType !== "Other") {
      throw new BadRequestException("Evidence must link to Document Control, storage, or a related source record.");
    }
    const payload = {
      company_id: user.tenantId,
      site_id: execution.site_id,
      execution_id: execution.id,
      execution_section_id: dto.executionSectionId ?? null,
      execution_item_id: dto.executionItemId ?? null,
      response_id: dto.responseId ?? null,
      field_finding_id: dto.fieldFindingId ?? null,
      evidence_title: dto.evidenceTitle,
      evidence_type: dto.evidenceType,
      evidence_description: dto.evidenceDescription ?? null,
      document_id: dto.documentId ?? null,
      storage_file_id: dto.storageFileId ?? null,
      related_module: dto.relatedModule ?? null,
      related_record_id: dto.relatedRecordId ?? dto.externalReference ?? null,
      confidentiality_level: dto.confidentialityLevel ?? "Internal",
      evidence_status: dto.evidenceStatus ?? "Linked",
      uploaded_by: dto.storageFileId ? user.id : null,
      linked_by: user.id,
      updated_at: new Date().toISOString(),
    };
    const before = evidenceId ? await this.single("audit_execution_evidence_links", user, "id", evidenceId) : null;
    const after = evidenceId
      ? await this.db.single<Row>(this.db.from("audit_execution_evidence_links").update(payload).eq("company_id", user.tenantId).eq("id", evidenceId).select().single())
      : await this.db.single<Row>(this.db.from("audit_execution_evidence_links").insert(payload).select().single());
    await this.recalculate(user, execution.id);
    await this.event(user, execution, evidenceId ? "Evidence Updated" : "Evidence Linked", "Execution evidence saved", before, after);
    return this.detail(user, executionId);
  }

  async removeEvidence(user: RequestUser, executionId: string, evidenceId: string, dto: Row = {}) {
    if (!dto.reason) throw new BadRequestException("Remove reason is required.");
    const execution = await this.execution(user, executionId);
    this.assertEditable(execution);
    const before = await this.single("audit_execution_evidence_links", user, "id", evidenceId);
    const after = await this.db.single<Row>(
      this.db.from("audit_execution_evidence_links").update({ removed_at: new Date().toISOString(), removed_by: user.id, remove_reason: dto.reason }).eq("company_id", user.tenantId).eq("id", evidenceId).select().single(),
    );
    await this.recalculate(user, execution.id);
    await this.event(user, execution, "Evidence Removed", "Execution evidence removed", before, after);
    return this.detail(user, executionId);
  }

  async notes(user: RequestUser, executionId: string, noteId?: string) {
    const execution = await this.execution(user, executionId);
    if (noteId) return this.single("audit_field_notes", user, "id", noteId);
    return this.childRows("audit_field_notes", execution, "created_at", true);
  }

  async saveNote(user: RequestUser, executionId: string, dto: Row, noteId?: string) {
    const execution = await this.execution(user, executionId);
    this.assertEditable(execution);
    if (!dto.noteTitle || !dto.noteType || !dto.noteText) throw new BadRequestException("Note title, type, and text are required.");
    const payload = {
      company_id: user.tenantId,
      site_id: execution.site_id,
      unit_id: dto.unitId ?? execution.unit_id ?? null,
      area_id: dto.areaId ?? execution.area_id ?? null,
      equipment_id: dto.equipmentId ?? null,
      execution_id: execution.id,
      execution_section_id: dto.executionSectionId ?? null,
      execution_item_id: dto.executionItemId ?? null,
      note_title: dto.noteTitle,
      note_type: dto.noteType,
      note_text: dto.noteText,
      related_module: dto.relatedModule ?? null,
      related_record_id: dto.relatedRecordId ?? null,
      criticality: dto.criticality ?? null,
      visibility: dto.visibility ?? "Internal",
      updated_by: user.id,
      updated_at: new Date().toISOString(),
    };
    const before = noteId ? await this.single("audit_field_notes", user, "id", noteId) : null;
    const after = noteId
      ? await this.db.single<Row>(this.db.from("audit_field_notes").update(payload).eq("company_id", user.tenantId).eq("id", noteId).select().single())
      : await this.db.single<Row>(this.db.from("audit_field_notes").insert({ ...payload, created_by: user.id }).select().single());
    await this.event(user, execution, noteId ? "Field Note Updated" : "Field Note Created", "Execution field note saved", before, after);
    return this.detail(user, executionId);
  }

  async removeNote(user: RequestUser, executionId: string, noteId: string, dto: Row = {}) {
    if (!dto.reason) throw new BadRequestException("Delete reason is required.");
    const execution = await this.execution(user, executionId);
    this.assertEditable(execution);
    const before = await this.single("audit_field_notes", user, "id", noteId);
    const after = await this.db.single<Row>(
      this.db.from("audit_field_notes").update({ deleted_at: new Date().toISOString(), deleted_by: user.id, delete_reason: dto.reason }).eq("company_id", user.tenantId).eq("id", noteId).select().single(),
    );
    await this.event(user, execution, "Field Note Deleted", "Execution field note deleted", before, after);
    return this.detail(user, executionId);
  }

  async convertNoteToFinding(user: RequestUser, executionId: string, noteId: string, dto: Row = {}) {
    const note = await this.single("audit_field_notes", user, "id", noteId);
    const detail = await this.saveFinding(user, executionId, {
      executionSectionId: note.execution_section_id,
      executionItemId: note.execution_item_id,
      fieldNoteId: note.id,
      findingTitle: dto.findingTitle ?? note.note_title,
      findingType: dto.findingType ?? "Observation",
      findingDescription: dto.findingDescription ?? note.note_text,
      criticality: dto.criticality ?? note.criticality ?? "Medium",
      sourceModule: note.related_module,
      sourceRecordId: note.related_record_id,
      evidenceSummary: dto.evidenceSummary ?? null,
      recommendedAction: dto.recommendedAction ?? null,
    });
    await this.db.single(this.db.from("audit_field_notes").update({ converted_to_finding: true, field_finding_id: detail.findings?.at(-1)?.id ?? null }).eq("company_id", user.tenantId).eq("id", noteId).select("id").single());
    return detail;
  }

  async findings(user: RequestUser, query: Row = {}, executionId?: string, findingId?: string) {
    if (findingId) return this.single("audit_field_findings", user, "id", findingId);
    if (executionId) {
      const execution = await this.execution(user, executionId);
      return this.childRows("audit_field_findings", execution, "created_at");
    }
    let request: any = this.db.from("audit_field_findings").select("*", { count: "exact" }).eq("company_id", user.tenantId);
    if (!this.truthy(query.includeCancelled)) request = request.is("cancelled_at", null);
    if (query.siteId) {
      this.assertSite(user, String(query.siteId));
      request = request.eq("site_id", query.siteId);
    } else if (user.selectedSiteId && !user.corporateView) request = request.eq("site_id", user.selectedSiteId);
    for (const [inputKey, column] of Object.entries({ status: "field_finding_status", criticality: "criticality", type: "finding_type" })) {
      if (query[inputKey]) request = request.eq(column, query[inputKey]);
    }
    const { data, count, error } = await request.order("created_at", { ascending: false }).range(0, Math.min(249, Number(query.limit ?? 100) - 1));
    if (error) throw new BadRequestException(error.message);
    return { rows: data ?? [], total: count ?? data?.length ?? 0 };
  }

  async saveFinding(user: RequestUser, executionId: string, dto: Row, findingId?: string) {
    const execution = await this.execution(user, executionId);
    this.assertEditable(execution);
    if (!dto.findingTitle || !dto.findingType || !dto.findingDescription || !dto.criticality) {
      throw new BadRequestException("Finding title, type, description, and criticality are required.");
    }
    const payload = {
      company_id: user.tenantId,
      site_id: execution.site_id,
      unit_id: dto.unitId ?? execution.unit_id ?? null,
      area_id: dto.areaId ?? execution.area_id ?? null,
      equipment_id: dto.equipmentId ?? null,
      execution_id: execution.id,
      execution_section_id: dto.executionSectionId ?? null,
      execution_item_id: dto.executionItemId ?? null,
      response_id: dto.responseId ?? null,
      field_note_id: dto.fieldNoteId ?? null,
      finding_code: dto.findingCode ?? null,
      finding_title: dto.findingTitle,
      finding_type: dto.findingType,
      finding_description: dto.findingDescription,
      source_standard_snapshot_json: dto.sourceStandardSnapshot ?? null,
      source_module: dto.sourceModule ?? null,
      source_record_id: dto.sourceRecordId ?? null,
      criticality: dto.criticality,
      severity_foundation: dto.severityFoundation ?? null,
      risk_potential_foundation: dto.riskPotentialFoundation ?? null,
      immediate_concern: Boolean(dto.immediateConcern),
      stop_work_recommended: Boolean(dto.stopWorkRecommended),
      evidence_summary: dto.evidenceSummary ?? null,
      root_cause_suspected: dto.rootCauseSuspected ?? null,
      recommended_action: dto.recommendedAction ?? null,
      responsible_owner_user_id: dto.responsibleOwnerUserId ?? null,
      due_date_recommendation: dto.dueDateRecommendation ?? null,
      field_finding_status: dto.fieldFindingStatus ?? "Draft",
      updated_by: user.id,
      updated_at: new Date().toISOString(),
    };
    const before = findingId ? await this.single("audit_field_findings", user, "id", findingId) : null;
    const after = findingId
      ? await this.db.single<Row>(this.db.from("audit_field_findings").update(payload).eq("company_id", user.tenantId).eq("id", findingId).select().single())
      : await this.db.single<Row>(this.db.from("audit_field_findings").insert({ ...payload, created_by: user.id }).select().single());
    await this.recalculate(user, execution.id);
    await this.event(user, execution, findingId ? "Field Finding Updated" : "Field Finding Created", "Execution field finding saved", before, after);
    return this.detail(user, executionId);
  }

  async cancelFinding(user: RequestUser, executionId: string, findingId: string, dto: Row = {}) {
    if (!dto.reason) throw new BadRequestException("Cancel reason is required.");
    const execution = await this.execution(user, executionId);
    this.assertEditable(execution);
    const before = await this.single("audit_field_findings", user, "id", findingId);
    const after = await this.db.single<Row>(
      this.db.from("audit_field_findings").update({ field_finding_status: "Cancelled", cancelled_by: user.id, cancelled_at: new Date().toISOString(), cancel_reason: dto.reason }).eq("company_id", user.tenantId).eq("id", findingId).select().single(),
    );
    await this.recalculate(user, executionId);
    await this.event(user, execution, "Field Finding Cancelled", "Execution field finding cancelled", before, after);
    return this.detail(user, executionId);
  }

  async convertFinding(user: RequestUser, executionId: string, findingId: string, dto: Row = {}) {
    const execution = await this.execution(user, executionId);
    this.assertEditable(execution);
    const before = await this.single("audit_field_findings", user, "id", findingId);
    const after = await this.db.single<Row>(
      this.db
        .from("audit_field_findings")
        .update({
          converted_to_finding_register: true,
          finding_register_id: dto.findingRegisterId ?? before.finding_register_id ?? null,
          field_finding_status: dto.status ?? "Ready For Finding Register",
          updated_by: user.id,
          updated_at: new Date().toISOString(),
        })
        .eq("company_id", user.tenantId)
        .eq("id", findingId)
        .select()
        .single(),
    );
    await this.event(user, execution, "Field Finding Converted", "Field finding marked ready for the finding register/action engine", before, after);
    return this.detail(user, executionId);
  }

  async saveInterview(user: RequestUser, executionId: string, dto: Row, interviewId?: string) {
    return this.saveEngagement(user, executionId, "audit_execution_interviews", "Interview", dto, interviewId);
  }

  async saveWalkthrough(user: RequestUser, executionId: string, dto: Row, walkthroughId?: string) {
    return this.saveEngagement(user, executionId, "audit_execution_walkthroughs", "Walkthrough", dto, walkthroughId);
  }

  async removeChild(user: RequestUser, executionId: string, table: string, rowId: string, reason?: string) {
    if (!reason) throw new BadRequestException("Delete reason is required.");
    const execution = await this.execution(user, executionId);
    this.assertEditable(execution);
    const before = await this.single(table, user, "id", rowId);
    await this.db.many(this.db.from(table).delete().eq("company_id", user.tenantId).eq("id", rowId));
    await this.event(user, execution, `${this.tableTitle(table)} Deleted`, `${this.tableTitle(table)} deleted`, before, { reason });
    return this.detail(user, executionId);
  }

  async runReadiness(user: RequestUser, executionId: string) {
    const detail = await this.detail(user, executionId);
    const readiness = this.computeReadiness(detail.execution, detail.items, detail.responses, detail.evidence, detail.findings);
    const saved = await this.db.single<Row>(
      this.db
        .from("audit_execution_readiness_checks")
        .insert({
          company_id: user.tenantId,
          site_id: detail.execution.site_id,
          execution_id: executionId,
          readiness_status: readiness.readiness_status,
          mandatory_items_answered: readiness.mandatory_items_answered,
          required_comments_complete: readiness.required_comments_complete,
          required_evidence_complete: readiness.required_evidence_complete,
          na_justifications_complete: readiness.na_justifications_complete,
          safety_critical_items_reviewed: readiness.safety_critical_items_reviewed,
          validation_errors_resolved: readiness.validation_errors_resolved,
          lead_auditor_review_complete: readiness.lead_auditor_review_complete,
          completion_notes_complete: readiness.completion_notes_complete,
          ready_for_completion: readiness.ready_for_completion,
          ready_for_finding_register: readiness.ready_for_finding_register,
          missing_items_json: readiness.missing_items_json,
          warnings_json: readiness.warnings_json,
          checked_by: user.id,
        })
        .select()
        .single(),
    );
    await this.event(user, detail.execution, "Readiness Checked", "Audit execution readiness checked", null, saved);
    return saved;
  }

  async validate(user: RequestUser, executionId: string) {
    const detail = await this.detail(user, executionId);
    const readiness = this.computeReadiness(detail.execution, detail.items, detail.responses, detail.evidence, detail.findings);
    const result = {
      validationStatus: readiness.ready_for_completion ? "Pass" : "Blocked",
      errors: readiness.missing_items_json ?? [],
      warnings: readiness.warnings_json ?? [],
    };
    const saved = await this.db.single<Row>(
      this.db
        .from("audit_execution_validation_results")
        .insert({
          company_id: user.tenantId,
          site_id: detail.execution.site_id,
          execution_id: executionId,
          validation_status: result.validationStatus,
          validation_type: "Completion Readiness",
          errors_json: result.errors,
          warnings_json: result.warnings,
          result_summary_json: result,
          validated_by: user.id,
        })
        .select()
        .single(),
    );
    await this.event(user, detail.execution, "Execution Validated", "Audit execution validation run", null, saved);
    return saved;
  }

  async progress(user: RequestUser, executionId: string) {
    const detail = await this.detail(user, executionId);
    return detail.progress;
  }

  async activity(user: RequestUser, executionId: string) {
    const execution = await this.execution(user, executionId);
    return this.childRows("audit_execution_activity_events", execution, "created_at");
  }

  async historyRows(user: RequestUser, executionId?: string) {
    if (executionId) {
      const execution = await this.execution(user, executionId);
      return this.childRows("audit_execution_history_events", execution, "created_at");
    }
    let request: any = this.db.from("audit_execution_history_events").select("*").eq("company_id", user.tenantId);
    if (user.selectedSiteId && !user.corporateView) request = request.eq("site_id", user.selectedSiteId);
    return this.safeRows(request.order("created_at", { ascending: false }).limit(250));
  }

  async settings(user: RequestUser, siteId?: string | null) {
    if (siteId) this.assertSite(user, siteId);
    const scoped = siteId
      ? await this.safeSingle(this.db.from("audit_execution_settings").select("*").eq("company_id", user.tenantId).eq("site_id", siteId).maybeSingle())
      : null;
    const company = await this.safeSingle(this.db.from("audit_execution_settings").select("*").eq("company_id", user.tenantId).is("site_id", null).maybeSingle());
    return scoped ?? company ?? {
      require_plan_for_execution: true,
      require_approved_checklist_for_execution: true,
      require_lead_auditor_to_start: true,
      require_team_member_to_execute: false,
      require_all_mandatory_items_for_completion: true,
      require_evidence_for_mandatory_evidence_items: true,
      require_comment_for_non_compliant: true,
      require_na_justification: true,
      require_field_finding_for_safety_critical_non_compliance: true,
      allow_execution_reopen: true,
      allow_offline_mode_foundation: false,
      auto_create_field_finding_from_non_compliance: false,
      notify_lead_on_safety_critical_finding: true,
      update_plan_status_on_execution_start: true,
      update_plan_status_on_execution_complete: true,
    };
  }

  async updateSettings(user: RequestUser, dto: Row) {
    const siteId = dto.siteId ?? null;
    if (siteId) this.assertSite(user, siteId);
    const payload = {
      company_id: user.tenantId,
      site_id: siteId,
      require_plan_for_execution: dto.requirePlanForExecution ?? true,
      require_approved_checklist_for_execution: dto.requireApprovedChecklistForExecution ?? true,
      require_lead_auditor_to_start: dto.requireLeadAuditorToStart ?? true,
      require_team_member_to_execute: dto.requireTeamMemberToExecute ?? false,
      require_all_mandatory_items_for_completion: dto.requireAllMandatoryItemsForCompletion ?? true,
      require_evidence_for_mandatory_evidence_items: dto.requireEvidenceForMandatoryEvidenceItems ?? true,
      require_comment_for_non_compliant: dto.requireCommentForNonCompliant ?? true,
      require_na_justification: dto.requireNaJustification ?? true,
      require_field_finding_for_safety_critical_non_compliance: dto.requireFieldFindingForSafetyCriticalNonCompliance ?? true,
      allow_execution_reopen: dto.allowExecutionReopen ?? true,
      allow_offline_mode_foundation: dto.allowOfflineModeFoundation ?? false,
      auto_create_field_finding_from_non_compliance: dto.autoCreateFieldFindingFromNonCompliance ?? false,
      notify_lead_on_safety_critical_finding: dto.notifyLeadOnSafetyCriticalFinding ?? true,
      update_plan_status_on_execution_start: dto.updatePlanStatusOnExecutionStart ?? true,
      update_plan_status_on_execution_complete: dto.updatePlanStatusOnExecutionComplete ?? true,
      settings_json: dto.settingsJson ?? null,
      updated_by: user.id,
      updated_at: new Date().toISOString(),
    };
    const existing = siteId
      ? await this.safeSingle(this.db.from("audit_execution_settings").select("id").eq("company_id", user.tenantId).eq("site_id", siteId).maybeSingle())
      : await this.safeSingle(this.db.from("audit_execution_settings").select("id").eq("company_id", user.tenantId).is("site_id", null).maybeSingle());
    if (existing?.id) {
      return this.db.single<Row>(
        this.db.from("audit_execution_settings").update(payload).eq("company_id", user.tenantId).eq("id", existing.id).select().single(),
      );
    }
    return this.db.single<Row>(this.db.from("audit_execution_settings").insert(payload).select().single());
  }

  async scopedExecutions(user: RequestUser, column: string, value: string, query: Row = {}) {
    return this.register(user, { ...query, [column === "site_id" ? "siteId" : column]: value });
  }

  private async saveEngagement(user: RequestUser, executionId: string, table: string, title: string, dto: Row, rowId?: string) {
    const execution = await this.execution(user, executionId);
    this.assertEditable(execution);
    const isInterview = table === "audit_execution_interviews";
    const requiredTitle = isInterview ? dto.interviewTitle : dto.walkthroughTitle;
    if (!requiredTitle) throw new BadRequestException(`${title} title is required.`);
    const payload: Row = isInterview
      ? {
          company_id: user.tenantId,
          site_id: execution.site_id,
          unit_id: dto.unitId ?? execution.unit_id ?? null,
          area_id: dto.areaId ?? execution.area_id ?? null,
          execution_id: execution.id,
          interview_title: dto.interviewTitle,
          interviewee_name: dto.intervieweeName ?? null,
          interviewee_user_id: dto.intervieweeUserId ?? null,
          interviewee_worker_id: dto.intervieweeWorkerId ?? null,
          department: dto.department ?? null,
          role_title: dto.roleTitle ?? null,
          interview_at: dto.interviewAt ?? null,
          interviewer_user_id: dto.interviewerUserId ?? user.id,
          execution_section_id: dto.executionSectionId ?? null,
          execution_item_id: dto.executionItemId ?? null,
          summary: dto.summary ?? null,
          key_points_json: dto.keyPoints ?? null,
          follow_up_required: Boolean(dto.followUpRequired),
          confidentiality_level: dto.confidentialityLevel ?? "Internal",
          notes: dto.notes ?? null,
          updated_by: user.id,
          updated_at: new Date().toISOString(),
        }
      : {
          company_id: user.tenantId,
          site_id: execution.site_id,
          unit_id: dto.unitId ?? execution.unit_id ?? null,
          area_id: dto.areaId ?? execution.area_id ?? null,
          equipment_id: dto.equipmentId ?? null,
          execution_id: execution.id,
          walkthrough_title: dto.walkthroughTitle,
          walkthrough_at: dto.walkthroughAt ?? null,
          auditor_user_id: dto.auditorUserId ?? user.id,
          participants_json: dto.participants ?? null,
          execution_section_id: dto.executionSectionId ?? null,
          execution_item_id: dto.executionItemId ?? null,
          observations: dto.observations ?? null,
          field_conditions: dto.fieldConditions ?? null,
          follow_up_required: Boolean(dto.followUpRequired),
          notes: dto.notes ?? null,
          updated_by: user.id,
          updated_at: new Date().toISOString(),
        };
    const before = rowId ? await this.single(table, user, "id", rowId) : null;
    const after = rowId
      ? await this.db.single<Row>(this.db.from(table).update(payload).eq("company_id", user.tenantId).eq("id", rowId).select().single())
      : await this.db.single<Row>(this.db.from(table).insert({ ...payload, created_by: user.id }).select().single());
    await this.event(user, execution, `${title} ${rowId ? "Updated" : "Created"}`, `${title} saved`, before, after);
    return this.detail(user, executionId);
  }

  private async materializeChecklist(user: RequestUser, execution: Row, sections: Row[], items: Row[]) {
    try {
      const sectionMap = new Map<string, string>();
      for (const section of sections) {
        const created = await this.db.single<Row>(
          this.db
            .from("audit_execution_sections")
            .insert({
              company_id: user.tenantId,
              site_id: execution.site_id,
              execution_id: execution.id,
              checklist_section_id: section.id,
              section_code: section.section_code,
              section_title: section.section_title,
              section_description: section.section_description,
              section_order: section.section_order,
              section_criticality: section.section_criticality,
              mandatory: section.mandatory,
              total_items: items.filter((item) => item.section_id === section.id).length,
              pending_items: items.filter((item) => item.section_id === section.id).length,
            })
            .select()
            .single(),
        );
        sectionMap.set(section.id, created.id);
      }
      if (items.length) {
        await this.db.many(
          this.db
            .from("audit_execution_items")
            .insert(
              items.map((item) => ({
                company_id: user.tenantId,
                site_id: execution.site_id,
                execution_id: execution.id,
                execution_section_id: sectionMap.get(item.section_id),
                checklist_item_id: item.id,
                item_code: item.item_code,
                item_text: item.item_text,
                item_order: item.item_order,
                question_type: item.question_type,
                response_type: item.response_type,
                required_response: item.required_response,
                mandatory_evidence: item.mandatory_evidence,
                may_create_finding: item.may_create_finding,
                safety_critical: item.safety_critical,
                regulatory_critical: item.regulatory_critical,
                psm_critical: item.psm_critical,
                severity_foundation: item.severity_foundation,
                expected_evidence: item.expected_evidence,
                guidance_text: item.guidance_text,
                standard_snapshot_json: item.standard_snapshot_json ?? null,
                module_snapshot_json: item.module_snapshot_json ?? null,
                applicability_condition_json: item.applicability_condition_json ?? null,
                not_applicable_allowed: item.not_applicable_allowed,
                comments_required: item.comments_required,
                attachments_allowed: item.attachments_allowed,
                attachments_required: item.attachments_required,
                future_scoring_weight: item.future_scoring_weight,
              })),
            )
            .select(),
        );
      }
    } catch (error) {
      await this.db.many(this.db.from("audit_executions").delete().eq("company_id", user.tenantId).eq("id", execution.id));
      throw error;
    }
  }

  private async recalculate(user: RequestUser, executionId: string) {
    const detail = await this.detail(user, executionId);
    const items = detail.items;
    const responses = detail.responses;
    const findings = detail.findings.filter((finding: Row) => !finding.cancelled_at);
    const requiredEvidenceItems = items.filter((item: Row) => item.mandatory_evidence || item.attachments_required);
    const evidenceMissing = requiredEvidenceItems.filter((item: Row) => !detail.evidence.some((evidence: Row) => evidence.execution_item_id === item.id && !evidence.removed_at)).length;
    const completed = items.filter((item: Row) => responses.some((response: Row) => response.execution_item_id === item.id && response.response_status !== "Reopened")).length;
    const nonCompliant = responses.filter((response: Row) => NEGATIVE_RESULTS.includes(response.compliance_result)).length;
    const progressPercent = items.length ? Math.round((completed / items.length) * 100) : 0;
    const progressStatus = progressPercent >= 100 ? "Complete" : progressPercent > 0 ? "In Progress" : "Not Started";
    const patch = {
      progress_percent: progressPercent,
      progress_status: progressStatus,
      completed_items: completed,
      pending_items: Math.max(0, items.length - completed),
      non_compliant_items: nonCompliant,
      evidence_required_count: requiredEvidenceItems.length,
      evidence_missing_count: evidenceMissing,
      evidence_status: evidenceMissing ? "Missing Evidence" : requiredEvidenceItems.length ? "Complete" : "Not Required",
      field_findings_count: findings.length,
      critical_findings_count: findings.filter((finding: Row) => ["Critical", "Safety-Critical", "Regulatory-Critical", "PSM-Critical"].includes(finding.criticality)).length,
      ready_for_finding_register: findings.length > 0 && findings.every((finding: Row) => ["Ready For Finding Register", "Converted", "Accepted"].includes(finding.field_finding_status)),
      updated_by: user.id,
      updated_at: new Date().toISOString(),
    };
    await this.db.single<Row>(this.db.from("audit_executions").update(patch).eq("company_id", user.tenantId).eq("id", executionId).select("id").single());
    return patch;
  }

  private computeReadiness(execution: Row, items: Row[], responses: Row[], evidence: Row[], findings: Row[]) {
    const missing: string[] = [];
    const warnings: string[] = [];
    const responseByItem = new Map(responses.map((response) => [response.execution_item_id, response]));
    const mandatory = items.filter((item) => item.required_response);
    const unanswered = mandatory.filter((item) => !responseByItem.has(item.id));
    if (unanswered.length) missing.push(`${unanswered.length} mandatory checklist item(s) unanswered.`);
    const commentMissing = responses.filter((response) => NEGATIVE_RESULTS.includes(response.compliance_result) && !response.comment);
    if (commentMissing.length) missing.push(`${commentMissing.length} non-compliant response(s) missing comments.`);
    const naMissing = responses.filter((response) => response.compliance_result === "Not Applicable" && !response.na_justification);
    if (naMissing.length) missing.push(`${naMissing.length} N/A response(s) missing justification.`);
    const requiredEvidenceItems = items.filter((item) => item.mandatory_evidence || item.attachments_required);
    const evidenceMissing = requiredEvidenceItems.filter((item) => !evidence.some((link) => link.execution_item_id === item.id && !link.removed_at));
    if (evidenceMissing.length) missing.push(`${evidenceMissing.length} required evidence item(s) missing.`);
    const safetyCriticalNegative = responses.filter((response) => {
      const item = items.find((candidate) => candidate.id === response.execution_item_id);
      return item?.safety_critical && NEGATIVE_RESULTS.includes(response.compliance_result) && !findings.some((finding) => finding.response_id === response.id && !finding.cancelled_at);
    });
    if (safetyCriticalNegative.length) missing.push(`${safetyCriticalNegative.length} safety-critical non-compliance(s) need field findings.`);
    if (!execution.lead_auditor_user_id) missing.push("Lead auditor is missing.");
    if (findings.some((finding) => finding.immediate_concern && !finding.converted_to_finding_register)) warnings.push("Immediate concern finding has not been converted to finding register/action engine foundation.");
    const blocked = missing.length > 0;
    return {
      readiness_status: blocked ? "Blocked" : warnings.length ? "Warning" : "Ready",
      mandatory_items_answered: unanswered.length === 0,
      required_comments_complete: commentMissing.length === 0,
      required_evidence_complete: evidenceMissing.length === 0,
      na_justifications_complete: naMissing.length === 0,
      safety_critical_items_reviewed: safetyCriticalNegative.length === 0,
      validation_errors_resolved: !blocked,
      lead_auditor_review_complete: Boolean(execution.lead_auditor_user_id),
      completion_notes_complete: true,
      ready_for_completion: !blocked,
      ready_for_finding_register: findings.length > 0 && findings.every((finding) => finding.converted_to_finding_register || ["Ready For Finding Register", "Converted"].includes(finding.field_finding_status)),
      missing_items_json: missing,
      warnings_json: warnings,
    };
  }

  private progressPayload(execution: Row, sections: Row[], items: Row[], responses: Row[], evidence: Row[], findings: Row[]) {
    return {
      executionId: execution.id,
      progressPercent: execution.progress_percent ?? 0,
      totalItems: items.length,
      completedItems: responses.length,
      pendingItems: Math.max(0, items.length - responses.length),
      sectionsComplete: sections.filter((section) => section.section_status === "Complete").length,
      evidenceLinked: evidence.filter((link) => !link.removed_at).length,
      findings: findings.filter((finding) => !finding.cancelled_at).length,
      criticalFindings: findings.filter((finding) => ["Critical", "Safety-Critical", "Regulatory-Critical", "PSM-Critical"].includes(finding.criticality)).length,
    };
  }

  private validateResponse(item: Row, dto: Row) {
    if (dto.complianceResult === "Not Applicable" && !item.not_applicable_allowed) throw new BadRequestException("This checklist item does not allow N/A.");
    if (dto.complianceResult === "Not Applicable" && !dto.naJustification) throw new BadRequestException("N/A justification is required.");
    if ((item.comments_required || NEGATIVE_RESULTS.includes(dto.complianceResult)) && !dto.comment) throw new BadRequestException("Comment is required for this response.");
    if (!dto.responseStatus) throw new BadRequestException("Response status is required.");
  }

  private async execution(user: RequestUser, id: string) {
    const execution = await this.single("audit_executions", user, "id", id);
    if (execution.site_id) this.assertSite(user, execution.site_id);
    return execution;
  }

  private async item(user: RequestUser, execution: Row, itemId: string) {
    const item = await this.single("audit_execution_items", user, "id", itemId);
    if (item.execution_id !== execution.id) throw new NotFoundException("Checklist item does not belong to this execution.");
    return item;
  }

  private async single(table: string, user: RequestUser, column: string, value: string) {
    const row = await this.safeSingle(this.db.from(table).select("*").eq("company_id", user.tenantId).eq(column, value).maybeSingle());
    if (!row) throw new NotFoundException("Record not found.");
    if (row.site_id) this.assertSite(user, row.site_id);
    return row;
  }

  private childRows(table: string, execution: Row, orderColumn: string, excludeDeleted = false) {
    let request: any = this.db.from(table).select("*").eq("company_id", execution.company_id).eq("execution_id", execution.id);
    if (excludeDeleted) request = request.is("deleted_at", null);
    return this.safeRows(request.order(orderColumn, { ascending: true }));
  }

  private planRows(table: string, user: RequestUser, planId: string) {
    return this.safeRows(this.db.from(table).select("*").eq("company_id", user.tenantId).eq("plan_id", planId));
  }

  private checkRows(table: string, user: RequestUser, checklistId: string) {
    return this.safeRows(this.db.from(table).select("*").eq("company_id", user.tenantId).eq("checklist_id", checklistId).is("removed_at", null).order(table.endsWith("_sections") ? "section_order" : "item_order"));
  }

  private async updatePlanExecutionStatus(user: RequestUser, execution: Row, status: string) {
    if (!execution.plan_id) return;
    await this.safeRows(
      this.db
        .from("audit_plans")
        .update({ plan_status: status, updated_by: user.id, updated_at: new Date().toISOString() })
        .eq("company_id", user.tenantId)
        .eq("id", execution.plan_id)
        .select("id"),
    );
  }

  private async safeSingle(query: PromiseLike<any>) {
    try {
      return await this.db.single<Row>(query);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new BadRequestException(message);
    }
  }

  private async safeRows(query: PromiseLike<any>) {
    try {
      return await this.db.many<Row>(query);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new BadRequestException(message);
    }
  }

  private assertSite(user: RequestUser, siteId: string) {
    if (user.isSuperAdmin || user.isCompanyAdmin || user.corporateView) return;
    if (!user.siteIds.includes(siteId)) throw new ForbiddenException("Audit execution site is outside your site access.");
  }

  private assertEditable(execution: Row) {
    if (CLOSED_STATUSES.includes(execution.execution_status)) throw new ForbiddenException("Completed, cancelled, or archived audit executions are read-only.");
  }

  private filterSites(user: RequestUser, rows: Row[]) {
    if (user.isSuperAdmin || user.isCompanyAdmin || user.corporateView) return rows;
    return rows.filter((site) => user.siteIds.includes(site.id));
  }

  private summary(rows: Row[]) {
    return {
      total: rows.length,
      readyToStart: rows.filter((row) => row.execution_status === "Ready To Start").length,
      inProgress: rows.filter((row) => row.execution_status === "In Progress").length,
      paused: rows.filter((row) => row.execution_status === "Paused").length,
      completed: rows.filter((row) => row.execution_status === "Completed").length,
      blocked: rows.filter((row) => row.execution_status === "Blocked").length,
      pendingResponses: rows.reduce((sum, row) => sum + Number(row.pending_items ?? 0), 0),
      pendingEvidence: rows.reduce((sum, row) => sum + Number(row.evidence_missing_count ?? 0), 0),
      fieldFindings: rows.reduce((sum, row) => sum + Number(row.field_findings_count ?? 0), 0),
      criticalFindings: rows.reduce((sum, row) => sum + Number(row.critical_findings_count ?? 0), 0),
      readyForFindingRegister: rows.filter((row) => row.ready_for_finding_register).length,
    };
  }

  private group(rows: Row[], key: string) {
    return Object.entries(
      rows.reduce((accumulator: Row, row) => {
        const value = String(row[key] ?? "Unassigned");
        accumulator[value] = (accumulator[value] ?? 0) + 1;
        return accumulator;
      }, {}),
    ).map(([label, value]) => ({ label, value }));
  }

  private pick(source: Row, pairs: [string, string][]) {
    return pairs.reduce((patch: Row, [inputKey, column]) => {
      if (source[inputKey] !== undefined) patch[column] = source[inputKey];
      return patch;
    }, {});
  }

  private inferCompliance(value: unknown) {
    const text = String(value ?? "").trim();
    if (!text) return "Not Verified";
    if (POSITIVE_RESULTS.some((candidate) => candidate.toLowerCase() === text.toLowerCase())) return "Compliant";
    if (NEGATIVE_RESULTS.some((candidate) => candidate.toLowerCase() === text.toLowerCase())) return "Non-Compliant";
    if (text.toLowerCase().includes("partial")) return "Partially Compliant";
    if (text.toLowerCase().includes("n/a") || text.toLowerCase().includes("not applicable")) return "Not Applicable";
    return text;
  }

  private truthy(value: unknown) {
    return value === true || value === "true" || value === "1" || value === 1;
  }

  private title(value: string) {
    return value.slice(0, 1).toUpperCase() + value.slice(1);
  }

  private tableTitle(table: string) {
    return table.replace(/^audit_execution_/, "").replace(/^audit_field_/, "field_").replace(/_/g, " ");
  }

  private event(user: RequestUser, execution: Row, type: string, title: string, before: any, after: any) {
    return this.history.write({
      tenantId: user.tenantId,
      actorId: user.id,
      executionId: execution.id,
      siteId: execution.site_id,
      unitId: execution.unit_id,
      areaId: execution.area_id,
      programId: execution.program_id,
      planId: execution.plan_id,
      checklistId: execution.checklist_id,
      type,
      title,
      before,
      after,
    });
  }
}
