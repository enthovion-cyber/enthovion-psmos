import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { RequestUser } from "../common/decorators/current-user.decorator";
import { SupabaseService } from "../database/supabase.service";
import {
  auditableModules,
  criticalityLevels,
  standardOptions,
} from "./audit-compliance.constants";
import { AuditFindingHistoryService } from "./audit-finding-history.service";

type Row = Record<string, any>;

const LOCKED_STATUSES = ["Confirmed", "Rejected", "Ready For CAPA", "CAPA Created Foundation", "Archived"];
const CLOSED_STATUSES = ["Rejected", "Archived", "Cancelled"];

const findingStatuses = [
  "Draft",
  "Open",
  "Under Review",
  "Needs More Information",
  "Confirmed",
  "Rejected",
  "Ready For CAPA",
  "CAPA Created Foundation",
  "In CAPA Foundation",
  "Closure Pending Foundation",
  "Closed Foundation",
  "Reopened",
  "Cancelled",
  "Archived",
];
const reviewStatuses = ["Not Required", "Pending Review", "Under Review", "Approved / Confirmed", "Rejected", "Returned", "Stale", "Review Overdue"];
const capaReadinessStatuses = ["Not Ready", "Missing Classification", "Missing Owner", "Missing Due Date", "Missing Evidence", "Needs Confirmation", "Ready For CAPA", "CAPA Created Foundation"];
const evidenceStatuses = ["Not Required", "Missing", "Partial", "Linked", "Attached", "Verified Foundation", "Restricted"];
const duplicateStatuses = ["Not Checked", "New Finding", "Potential Duplicate", "Repeat Finding", "Recurring Finding", "Merged Foundation", "Dismissed Duplicate"];
const findingTypes = [
  "Non-Conformance",
  "Major Non-Conformance",
  "Minor Non-Conformance",
  "Observation",
  "Opportunity For Improvement",
  "Positive Practice",
  "Safety-Critical Gap",
  "Regulatory Gap",
  "PSM System Gap",
  "Procedure Gap",
  "Training Gap",
  "PTW Gap",
  "MOC Gap",
  "PSSR Gap",
  "PSI Gap",
  "Mechanical Integrity Gap",
  "Incident / CAPA Gap",
  "Document Control Gap",
  "Equipment Integrity Gap",
  "Housekeeping / Field Condition",
  "Emergency Preparedness Gap",
  "Contractor Management Gap",
  "Management System Gap",
  "Custom",
];
const priorities = ["Low", "Medium", "High", "Urgent", "Immediate"];
const riskPotentialLevels = ["Low", "Medium", "High", "Major", "Catastrophic"];
const sourceTypes = [
  "Audit Execution Field Finding",
  "Checklist Response",
  "Audit Field Note",
  "Audit Evidence Review",
  "Audit Interview",
  "Audit Walkthrough",
  "Manual Finding",
  "External Audit Foundation",
  "Regulatory Inspection Foundation",
  "Custom",
];
const recurrenceCategories = ["First Time", "Repeat Same Area", "Repeat Same Module", "Repeat Same Standard", "Repeat Same Equipment", "Repeat Same Root Cause Foundation", "Recurring Corporate Finding", "Unknown"];

@Injectable()
export class AuditFindingService {
  constructor(
    private readonly db: SupabaseService,
    private readonly history: AuditFindingHistoryService,
  ) {}

  lookups() {
    return {
      findingStatuses,
      findingTypes,
      findingSeverities: criticalityLevels,
      findingPriorities: priorities,
      riskPotentialLevels,
      findingSourceTypes: sourceTypes,
      findingReviewStatuses: reviewStatuses,
      findingCapaReadinessStatuses: capaReadinessStatuses,
      findingEvidenceStatuses: evidenceStatuses,
      findingDuplicateRepeatStatuses: duplicateStatuses,
      findingRecurrenceCategories: recurrenceCategories,
      auditableModules: auditableModules.map(([key, label]) => ({ key, label })),
      standardOptions,
      dueDateBases: ["Severity-based", "Regulatory requirement", "Audit team recommendation", "Site policy", "Management decision", "Custom"],
    };
  }

  async context(user: RequestUser) {
    const [sites, units, areas, users, programs, plans, executions, checklists, settings] = await Promise.all([
      this.safeRows(this.db.from("Site").select("id,name,tenantId").eq("tenantId", user.tenantId).order("name")),
      this.safeRows(this.db.from("Unit").select("id,name,siteId,tenantId").eq("tenantId", user.tenantId).order("name")),
      this.safeRows(this.db.from("Area").select("id,name,siteId,unitId,tenantId").eq("tenantId", user.tenantId).order("name")),
      this.safeRows(this.db.from("User").select("id,name,email,role,department,isActive,tenantId").eq("tenantId", user.tenantId).order("name")),
      this.safeRows(this.db.from("audit_programs").select("id,program_code,program_title,program_status,site_id").eq("company_id", user.tenantId).order("program_title")),
      this.safeRows(this.db.from("audit_plans").select("id,plan_code,plan_title,plan_status,program_id,site_id").eq("company_id", user.tenantId).order("plan_title")),
      this.safeRows(this.db.from("audit_executions").select("id,execution_code,execution_title,execution_status,program_id,plan_id,checklist_id,site_id,unit_id,area_id").eq("company_id", user.tenantId).order("updated_at", { ascending: false })),
      this.safeRows(this.db.from("audit_checklist_templates").select("id,checklist_code,checklist_title,checklist_status").eq("company_id", user.tenantId).order("checklist_title")),
      this.settings(user, user.selectedSiteId ?? null),
    ]);
    return {
      sites: this.filterSites(user, sites),
      units,
      areas,
      users: users.filter((u) => u.isActive !== false),
      programs,
      plans,
      executions,
      checklists,
      settings,
      lookups: this.lookups(),
    };
  }

  async dashboard(user: RequestUser, query: Row = {}) {
    const register = await this.register(user, { ...query, page: 1, limit: 1000 });
    const rows = register.rows;
    return {
      summary: this.summary(rows),
      bySite: this.group(rows, "site_id"),
      byModule: this.group(rows, "primary_module"),
      byStatus: this.group(rows, "finding_status"),
      bySeverity: this.group(rows, "severity"),
      byType: this.group(rows, "finding_type"),
      byOwner: this.group(rows, "owner_user_id"),
      overdue: rows.filter((row) => this.isOverdue(row)),
      safetyCritical: rows.filter((row) => row.safety_critical),
      regulatoryCritical: rows.filter((row) => row.regulatory_critical),
      psmCritical: rows.filter((row) => row.psm_critical),
      repeatFindings: rows.filter((row) => row.repeat_finding),
      awaitingOwner: rows.filter((row) => !row.owner_user_id && !CLOSED_STATUSES.includes(row.finding_status)),
      readyForCapa: rows.filter((row) => row.ready_for_capa || row.capa_readiness_status === "Ready For CAPA"),
      recent: rows.slice(0, 12),
      requiringReview: rows.filter((row) => ["Pending Review", "Under Review", "Review Overdue"].includes(row.review_status)),
    };
  }

  async register(user: RequestUser, query: Row = {}) {
    const page = Math.max(1, Number(query.page ?? 1));
    const limit = Math.min(250, Math.max(1, Number(query.limit ?? 25)));
    let request: any = this.db
      .from("audit_findings")
      .select("*", { count: "exact" })
      .eq("company_id", user.tenantId);
    if (!this.truthy(query.includeArchived)) request = request.is("archived_at", null);
    const scopedSite = query.siteId ?? user.selectedSiteId;
    if (scopedSite) {
      this.assertSite(user, String(scopedSite));
      request = request.eq("site_id", scopedSite);
    } else if (user.selectedSiteId && !user.corporateView) request = request.eq("site_id", user.selectedSiteId);
    for (const [inputKey, column] of Object.entries({
      status: "finding_status",
      findingStatus: "finding_status",
      findingType: "finding_type",
      type: "finding_type",
      severity: "severity",
      priority: "priority",
      criticality: "criticality",
      programId: "program_id",
      planId: "plan_id",
      executionId: "execution_id",
      checklistId: "checklist_id",
      unitId: "unit_id",
      areaId: "area_id",
      ownerUserId: "owner_user_id",
      reviewerUserId: "reviewer_user_id",
      capaReadinessStatus: "capa_readiness_status",
      evidenceStatus: "evidence_status",
      duplicateRepeatStatus: "duplicate_repeat_status",
    })) {
      if (query[inputKey]) request = request.eq(column, query[inputKey]);
    }
    if (this.truthy(query.safetyCritical)) request = request.eq("safety_critical", true);
    if (this.truthy(query.regulatoryCritical)) request = request.eq("regulatory_critical", true);
    if (this.truthy(query.psmCritical)) request = request.eq("psm_critical", true);
    if (this.truthy(query.repeatFinding)) request = request.eq("repeat_finding", true);
    if (this.truthy(query.readyForCapa)) request = request.eq("ready_for_capa", true);
    if (this.truthy(query.awaitingOwner)) request = request.is("owner_user_id", null);
    if (query.search) {
      const search = String(query.search).replace(/[,%()]/g, " ").trim();
      if (search) request = request.or(`finding_code.ilike.%${search}%,finding_title.ilike.%${search}%,finding_description.ilike.%${search}%`);
    }
    const sort = String(query.sort ?? "updated_at.desc");
    const [sortColumn, direction] = sort.split(".");
    const { data, count, error } = await request
      .order(sortColumn || "updated_at", { ascending: direction === "asc" })
      .range((page - 1) * limit, page * limit - 1);
    if (error) throw new BadRequestException(error.message);
    const rows = data ?? [];
    const filtered = this.truthy(query.overdue) ? rows.filter((row: Row) => this.isOverdue(row)) : rows;
    const enriched = await this.enrichRows(user, filtered);
    return { rows: enriched, total: count ?? filtered.length, page, limit, summary: this.summary(filtered) };
  }

  async detail(user: RequestUser, findingId: string) {
    const finding = await this.finding(user, findingId);
    const [sources, standards, modules, evidence, ownership, review, duplicates, capa, transitions, history] = await Promise.all([
      this.findingChildren("audit_finding_sources", finding),
      this.findingChildren("audit_finding_standard_links", finding),
      this.findingChildren("audit_finding_module_links", finding),
      this.findingChildren("audit_finding_evidence_links", finding),
      this.findingChildren("audit_finding_ownership_records", finding),
      this.findingChildren("audit_finding_review_records", finding),
      this.findingChildren("audit_finding_duplicate_checks", finding),
      this.findingChildren("audit_finding_capa_foundation_links", finding),
      this.findingChildren("audit_finding_status_transitions", finding, "created_at"),
      this.findingChildren("audit_finding_history_events", finding, "created_at"),
    ]);
    return {
      finding,
      sources,
      standards,
      modules,
      evidence,
      ownership,
      review,
      duplicates,
      capa,
      transitions,
      history,
      readiness: this.calculateReadinessPayload(finding, evidence, sources),
    };
  }

  async create(user: RequestUser, dto: Row) {
    const settings = await this.settings(user, dto.siteId ?? user.selectedSiteId ?? null);
    if (!dto.findingTitle) throw new BadRequestException("Finding title is required.");
    if (!settings.allow_manual_findings && (dto.sourceType ?? "Manual Finding") === "Manual Finding") throw new ForbiddenException("Manual findings are disabled by audit finding settings.");
    this.validateSource(dto, settings);
    const scoped = await this.resolveScope(user, dto);
    const code = dto.findingCode ?? await this.nextCode(user, scoped.site_id);
    const payload = this.findingPayload(user, dto, scoped, code);
    const finding = await this.db.single<Row>(this.db.from("audit_findings").insert(payload).select().single());
    await this.savePrimarySource(user, finding, dto, settings);
    await this.applyOptionalSections(user, finding, dto);
    await this.recalculateFinding(user, finding.id);
    await this.event(user, finding, "Finding Created", "Formal audit finding created", null, finding);
    return this.detail(user, finding.id);
  }

  async update(user: RequestUser, findingId: string, dto: Row) {
    const before = await this.finding(user, findingId);
    this.assertEditable(before);
    const scoped = await this.resolveScope(user, { ...before, ...dto });
    const patch = this.findingPatch(user, dto, scoped);
    const after = await this.db.single<Row>(this.db.from("audit_findings").update(patch).eq("company_id", user.tenantId).eq("id", findingId).select().single());
    await this.recalculateFinding(user, findingId);
    await this.event(user, after, "Finding Updated", "Formal audit finding updated", before, after);
    return this.detail(user, findingId);
  }

  async convertFieldFinding(user: RequestUser, executionId: string, fieldFindingId: string, dto: Row = {}) {
    const execution = await this.record("audit_executions", user, "id", executionId);
    const field = await this.record("audit_field_findings", user, "id", fieldFindingId);
    if (field.execution_id !== execution.id) throw new BadRequestException("Field finding does not belong to this audit execution.");
    if (field.converted_to_finding_register && field.finding_register_id) throw new BadRequestException("Field finding has already been converted to the formal finding register.");
    const detail = await this.create(user, {
      ...dto,
      sourceType: "Audit Execution Field Finding",
      sourceModule: "Audit Execution",
      sourceRecordId: field.id,
      executionId: execution.id,
      executionSectionId: field.execution_section_id,
      executionItemId: field.execution_item_id,
      responseId: field.response_id,
      fieldFindingId: field.id,
      siteId: field.site_id ?? execution.site_id,
      unitId: field.unit_id ?? execution.unit_id,
      areaId: field.area_id ?? execution.area_id,
      equipmentId: field.equipment_id,
      programId: execution.program_id,
      planId: execution.plan_id,
      checklistId: execution.checklist_id,
      findingTitle: dto.findingTitle ?? field.finding_title,
      findingDescription: dto.findingDescription ?? field.finding_description,
      findingType: dto.findingType ?? this.normalizeFieldFindingType(field.finding_type),
      criticality: dto.criticality ?? field.criticality ?? "Medium",
      severity: dto.severity ?? field.severity_foundation ?? null,
      riskPotential: dto.riskPotential ?? field.risk_potential_foundation ?? null,
      immediateConcern: dto.immediateConcern ?? field.immediate_concern,
      stopWorkRecommended: dto.stopWorkRecommended ?? field.stop_work_recommended,
      sourceDescription: "Converted from audit execution field finding.",
      sourceSnapshot: { execution, fieldFinding: field },
      suggestedCorrectiveAction: dto.suggestedCorrectiveAction ?? field.recommended_action,
      ownerUserId: dto.ownerUserId ?? field.responsible_owner_user_id,
      dueDate: dto.dueDate ?? field.due_date_recommendation,
    });
    const finding = detail.finding;
    await this.db.single(
      this.db
        .from("audit_field_findings")
        .update({ converted_to_finding_register: true, finding_register_id: finding.id, field_finding_status: "Ready For Finding Register", updated_by: user.id, updated_at: new Date().toISOString() })
        .eq("company_id", user.tenantId)
        .eq("id", field.id)
        .select("id")
        .single(),
    );
    await this.event(user, finding, "Field Finding Converted", "Audit execution field finding converted to formal finding", field, finding);
    return this.detail(user, finding.id);
  }

  async createFromResponse(user: RequestUser, executionId: string, responseId: string, dto: Row = {}) {
    const execution = await this.record("audit_executions", user, "id", executionId);
    const response = await this.record("audit_execution_responses", user, "id", responseId);
    if (response.execution_id !== execution.id) throw new BadRequestException("Checklist response does not belong to this audit execution.");
    return this.create(user, {
      ...dto,
      sourceType: "Checklist Response",
      sourceModule: "Audit Execution",
      sourceRecordId: response.id,
      responseId: response.id,
      executionId: execution.id,
      executionSectionId: response.execution_section_id,
      executionItemId: response.execution_item_id,
      siteId: execution.site_id,
      unitId: execution.unit_id,
      areaId: execution.area_id,
      programId: execution.program_id,
      planId: execution.plan_id,
      checklistId: execution.checklist_id,
      findingTitle: dto.findingTitle ?? `Finding from response ${response.id.slice(0, 8)}`,
      findingDescription: dto.findingDescription ?? response.comment ?? response.response_text ?? "Finding created from checklist response.",
      sourceSnapshot: { execution, response },
    });
  }

  async createFromFieldNote(user: RequestUser, executionId: string, noteId: string, dto: Row = {}) {
    const execution = await this.record("audit_executions", user, "id", executionId);
    const note = await this.record("audit_field_notes", user, "id", noteId);
    if (note.execution_id !== execution.id) throw new BadRequestException("Field note does not belong to this audit execution.");
    const detail = await this.create(user, {
      ...dto,
      sourceType: "Audit Field Note",
      sourceModule: "Audit Execution",
      sourceRecordId: note.id,
      fieldNoteId: note.id,
      executionId: execution.id,
      executionSectionId: note.execution_section_id,
      executionItemId: note.execution_item_id,
      siteId: note.site_id ?? execution.site_id,
      unitId: note.unit_id ?? execution.unit_id,
      areaId: note.area_id ?? execution.area_id,
      equipmentId: note.equipment_id,
      programId: execution.program_id,
      planId: execution.plan_id,
      checklistId: execution.checklist_id,
      findingTitle: dto.findingTitle ?? note.note_title,
      findingDescription: dto.findingDescription ?? note.note_text,
      criticality: dto.criticality ?? note.criticality ?? "Medium",
      sourceSnapshot: { execution, note },
    });
    await this.db.single(this.db.from("audit_field_notes").update({ converted_to_finding: true, field_finding_id: detail.finding.id, updated_by: user.id, updated_at: new Date().toISOString() }).eq("company_id", user.tenantId).eq("id", note.id).select("id").single());
    return detail;
  }

  async transition(user: RequestUser, findingId: string, action: string, dto: Row = {}) {
    const before = await this.finding(user, findingId);
    const evidence = await this.findingChildren("audit_finding_evidence_links", before);
    const sources = await this.findingChildren("audit_finding_sources", before);
    const settings = await this.settings(user, before.site_id ?? null);
    const validation = this.validateTransition(before, action, dto, evidence, sources, settings);
    const now = new Date().toISOString();
    const patch: Row = { updated_by: user.id, updated_at: now };
    let title = "Finding Updated";
    if (action === "confirm") {
      patch.finding_status = "Confirmed";
      patch.review_status = "Approved / Confirmed";
      patch.confirmed_by = user.id;
      patch.confirmed_at = now;
      title = "Finding Confirmed";
    } else if (action === "reject") {
      patch.finding_status = "Rejected";
      patch.review_status = "Rejected";
      patch.rejected_by = user.id;
      patch.rejected_at = now;
      patch.rejection_reason = dto.reason;
      title = "Finding Rejected";
    } else if (action === "request-more-information") {
      patch.finding_status = "Needs More Information";
      patch.review_status = "Returned";
      title = "Finding Returned For More Information";
    } else if (action === "mark-ready-for-capa") {
      patch.finding_status = "Ready For CAPA";
      patch.capa_readiness_status = "Ready For CAPA";
      patch.ready_for_capa = true;
      title = "Finding Marked Ready For CAPA";
    } else if (action === "reopen") {
      patch.finding_status = "Reopened";
      patch.reopened_by = user.id;
      patch.reopened_at = now;
      patch.reopen_reason = dto.reason;
      patch.ready_for_capa = false;
      title = "Finding Reopened";
    } else if (action === "archive") {
      patch.finding_status = "Archived";
      patch.archived_by = user.id;
      patch.archived_at = now;
      patch.archive_reason = dto.reason;
      title = "Finding Archived";
    } else if (action === "submit-review") {
      patch.finding_status = "Under Review";
      patch.review_status = "Pending Review";
      title = "Finding Submitted For Review";
    } else {
      throw new BadRequestException("Unsupported finding transition.");
    }
    const after = await this.db.single<Row>(this.db.from("audit_findings").update(patch).eq("company_id", user.tenantId).eq("id", findingId).select().single());
    await this.db.single(this.db.from("audit_finding_status_transitions").insert({
      company_id: user.tenantId,
      site_id: after.site_id,
      finding_id: findingId,
      from_status: before.finding_status,
      to_status: after.finding_status,
      transition_reason: dto.reason ?? dto.comment ?? null,
      transitioned_by: user.id,
      validation_result_json: validation,
    }).select("id").single());
    await this.event(user, after, title, dto.reason ?? title, before, after);
    return this.detail(user, findingId);
  }

  async sectionRows(user: RequestUser, findingId: string, section: string) {
    const finding = await this.finding(user, findingId);
    if (section === "review") return this.findingChildren("audit_finding_review_records", finding);
    if (section === "history") return this.findingChildren("audit_finding_history_events", finding);
    return this.findingChildren(this.sectionTable(section), finding);
  }

  async upsertSection(user: RequestUser, findingId: string, section: string, dto: Row, rowId?: string) {
    const finding = await this.finding(user, findingId);
    this.assertEditable(finding);
    const table = this.sectionTable(section);
    const payload = this.sectionPayload(user, finding, section, dto);
    const before = rowId ? await this.record(table, user, "id", rowId) : null;
    const after = rowId
      ? await this.db.single<Row>(this.db.from(table).update(payload).eq("company_id", user.tenantId).eq("id", rowId).select().single())
      : await this.db.single<Row>(this.db.from(table).insert(payload as any).select().single());
    if (section === "ownership") {
      await this.db.single(this.db.from("audit_findings").update({ owner_user_id: dto.ownerUserId, due_date: dto.dueDate ?? finding.due_date ?? null, updated_by: user.id, updated_at: new Date().toISOString() }).eq("company_id", user.tenantId).eq("id", findingId).select("id").single());
    }
    if (section === "capa-foundation") {
      await this.db.single(this.db.from("audit_findings").update({ capa_required: Boolean(dto.capaRequired), capa_record_id: dto.capaRecordId ?? finding.capa_record_id ?? null, suggested_corrective_action: dto.suggestedCorrectiveAction ?? finding.suggested_corrective_action ?? null, suggested_preventive_action: dto.suggestedPreventiveAction ?? finding.suggested_preventive_action ?? null, updated_by: user.id, updated_at: new Date().toISOString() }).eq("company_id", user.tenantId).eq("id", findingId).select("id").single());
    }
    await this.recalculateFinding(user, findingId);
    await this.event(user, finding, `${this.sectionTitle(section)} ${rowId ? "Updated" : "Added"}`, `${this.sectionTitle(section)} saved`, before, after);
    return this.detail(user, findingId);
  }

  async removeSection(user: RequestUser, findingId: string, section: string, rowId: string, reason?: string) {
    if (!reason) throw new BadRequestException("Remove reason is required.");
    const finding = await this.finding(user, findingId);
    this.assertEditable(finding);
    const table = this.sectionTable(section);
    const before = await this.record(table, user, "id", rowId);
    const after = await this.db.single<Row>(this.db.from(table).update({ removed_by: user.id, removed_at: new Date().toISOString(), remove_reason: reason }).eq("company_id", user.tenantId).eq("id", rowId).select().single());
    await this.recalculateFinding(user, findingId);
    await this.event(user, finding, `${this.sectionTitle(section)} Removed`, `${this.sectionTitle(section)} removed`, before, after);
    return this.detail(user, findingId);
  }

  async review(user: RequestUser, findingId: string, action: string, dto: Row = {}) {
    const finding = await this.finding(user, findingId);
    const now = new Date().toISOString();
    if (["reject", "return"].includes(action) && !dto.reason) throw new BadRequestException("Review reason is required.");
    const review = await this.db.single<Row>(this.db.from("audit_finding_review_records").insert({
      company_id: user.tenantId,
      site_id: finding.site_id,
      finding_id: findingId,
      review_status: action === "submit" ? "Pending Review" : action === "approve" ? "Approved / Confirmed" : action === "reject" ? "Rejected" : "Returned",
      submitted_by: action === "submit" ? user.id : null,
      submitted_at: action === "submit" ? now : null,
      reviewed_by: action !== "submit" ? user.id : null,
      reviewed_at: action !== "submit" ? now : null,
      review_decision: action,
      review_comment: dto.reason ?? dto.comment ?? null,
    }).select().single());
    const mapped = action === "submit" ? "submit-review" : action === "approve" ? "confirm" : action === "reject" ? "reject" : "request-more-information";
    await this.event(user, finding, `Finding Review ${action}`, dto.reason ?? dto.comment ?? "Review workflow updated", null, review);
    return this.transition(user, findingId, mapped, dto);
  }

  async checkDuplicates(user: RequestUser, findingId: string, dto: Row = {}) {
    const finding = await this.finding(user, findingId);
    const rows = await this.safeRows(
      this.db
        .from("audit_findings")
        .select("id,finding_code,finding_title,site_id,unit_id,area_id,finding_type,severity,criticality,created_at")
        .eq("company_id", user.tenantId)
        .neq("id", findingId)
        .eq("finding_type", finding.finding_type)
        .limit(25),
    );
    const matches = rows.filter((row) => row.site_id === finding.site_id || row.unit_id === finding.unit_id || row.area_id === finding.area_id);
    const duplicateStatus = matches.length ? "Potential Duplicate" : "New Finding";
    const check = await this.db.single<Row>(this.db.from("audit_finding_duplicate_checks").insert({
      company_id: user.tenantId,
      site_id: finding.site_id,
      finding_id: findingId,
      check_status: "Completed",
      duplicate_repeat_status: dto.overrideStatus ?? duplicateStatus,
      matched_finding_ids_json: matches.map((row) => row.id),
      match_reasons_json: matches.map((row) => `${row.finding_code}: same type and overlapping scope`),
      user_decision: dto.userDecision ?? null,
      user_decision_reason: dto.userDecisionReason ?? null,
      checked_by: user.id,
    }).select().single());
    const after = await this.db.single<Row>(this.db.from("audit_findings").update({ duplicate_repeat_status: check.duplicate_repeat_status, repeat_finding: ["Repeat Finding", "Recurring Finding"].includes(check.duplicate_repeat_status), updated_by: user.id, updated_at: new Date().toISOString() }).eq("company_id", user.tenantId).eq("id", findingId).select().single());
    await this.event(user, after, "Duplicate / Repeat Check Completed", "Backend duplicate/repeat check completed", finding, after);
    return this.detail(user, findingId);
  }

  async recalculateFinding(user: RequestUser, findingId: string) {
    const finding = await this.finding(user, findingId);
    const evidence = await this.findingChildren("audit_finding_evidence_links", finding);
    const sources = await this.findingChildren("audit_finding_sources", finding);
    const readiness = this.calculateReadinessPayload(finding, evidence, sources);
    const patch = {
      capa_readiness_status: readiness.capaReadinessStatus,
      evidence_status: readiness.evidenceStatus,
      ready_for_capa: readiness.readyForCapa,
      updated_by: user.id,
      updated_at: new Date().toISOString(),
    };
    const after = await this.db.single<Row>(this.db.from("audit_findings").update(patch).eq("company_id", user.tenantId).eq("id", findingId).select().single());
    await this.event(user, after, "Finding Readiness Calculated", "Backend readiness and CAPA readiness recalculated", finding, after);
    return this.detail(user, findingId);
  }

  async settings(user: RequestUser, siteId?: string | null) {
    if (siteId) this.assertSite(user, siteId);
    const site = siteId
      ? await this.safeSingle(this.db.from("audit_finding_settings").select("*").eq("company_id", user.tenantId).eq("site_id", siteId).maybeSingle())
      : null;
    const company = await this.safeSingle(this.db.from("audit_finding_settings").select("*").eq("company_id", user.tenantId).is("site_id", null).maybeSingle());
    return site ?? company ?? {
      require_source_for_finding: true,
      allow_manual_findings: true,
      require_manual_source_reason: true,
      require_classification_for_confirmation: true,
      require_owner_for_ready_capa: true,
      require_due_date_for_ready_capa: true,
      require_evidence_for_confirmation: false,
      require_review_for_safety_critical: true,
      require_review_for_regulatory_critical: true,
      require_review_for_psm_critical: true,
      auto_check_duplicates: true,
      duplicate_check_window_days: 730,
      block_confirmation_on_potential_duplicate: false,
      auto_mark_overdue: true,
      auto_notify_owner_on_assignment: true,
      auto_notify_lead_on_safety_critical: true,
      auto_create_capa_foundation_for_confirmed: false,
    };
  }

  async updateSettings(user: RequestUser, dto: Row) {
    const siteId = dto.siteId ?? null;
    if (siteId) this.assertSite(user, siteId);
    const existing = siteId
      ? await this.safeSingle(this.db.from("audit_finding_settings").select("id").eq("company_id", user.tenantId).eq("site_id", siteId).maybeSingle())
      : await this.safeSingle(this.db.from("audit_finding_settings").select("id").eq("company_id", user.tenantId).is("site_id", null).maybeSingle());
    const payload = { ...this.settingsPatch(dto), company_id: user.tenantId, site_id: siteId, updated_by: user.id, updated_at: new Date().toISOString() };
    const row = existing
      ? await this.db.single<Row>(this.db.from("audit_finding_settings").update(payload).eq("company_id", user.tenantId).eq("id", existing.id).select().single())
      : await this.db.single<Row>(this.db.from("audit_finding_settings").insert(payload).select().single());
    await this.history.write({ tenantId: user.tenantId, siteId, actorId: user.id, type: "Finding Settings Updated", title: "Audit finding settings updated", after: row });
    return row;
  }

  async sourceScopedRegister(user: RequestUser, scopeKey: string, id: string, query: Row = {}) {
    const map: Record<string, string> = {
      execution: "executionId",
      plan: "planId",
      program: "programId",
      checklist: "checklistId",
      site: "siteId",
      unit: "unitId",
      area: "areaId",
    };
    const column = map[scopeKey];
    if (!column) throw new BadRequestException("Unsupported finding scope.");
    const filters = column === "siteId" ? { ...query, siteId: id } : { ...query, [column]: id };
    return this.register(user, filters);
  }

  private async enrichRows(user: RequestUser, rows: Row[]) {
    if (!rows.length) return rows;
    const ownerIds = [...new Set(rows.map((row) => row.owner_user_id).filter(Boolean))];
    const users = ownerIds.length ? await this.safeRows(this.db.from("User").select("id,name,email,role,department").eq("tenantId", user.tenantId).in("id", ownerIds)) : [];
    const userById = new Map(users.map((row) => [row.id, row]));
    return rows.map((row) => ({ ...row, owner: row.owner_user_id ? userById.get(row.owner_user_id) ?? null : null, overdue: this.isOverdue(row) }));
  }

  private findingPayload(user: RequestUser, dto: Row, scoped: Row, code: string) {
    const criticality = dto.criticality ?? dto.severity ?? "Medium";
    return {
      company_id: user.tenantId,
      ...scoped,
      finding_code: code,
      finding_title: dto.findingTitle,
      finding_description: dto.findingDescription ?? null,
      finding_type: dto.findingType ?? "Observation",
      finding_status: dto.findingStatus ?? "Draft",
      review_status: dto.reviewStatus ?? "Not Required",
      capa_readiness_status: dto.capaReadinessStatus ?? "Not Ready",
      evidence_status: dto.evidenceStatus ?? "Not Required",
      duplicate_repeat_status: dto.duplicateRepeatStatus ?? "Not Checked",
      severity: dto.severity ?? null,
      priority: dto.priority ?? null,
      risk_potential: dto.riskPotential ?? null,
      criticality,
      safety_critical: Boolean(dto.safetyCritical ?? (criticality === "Safety-Critical" || dto.findingType === "Safety-Critical Gap")),
      regulatory_critical: Boolean(dto.regulatoryCritical ?? (criticality === "Regulatory-Critical" || dto.findingType === "Regulatory Gap")),
      psm_critical: Boolean(dto.psmCritical ?? (criticality === "PSM-Critical" || dto.findingType === "PSM System Gap")),
      immediate_concern: Boolean(dto.immediateConcern),
      stop_work_recommended: Boolean(dto.stopWorkRecommended),
      repeat_finding: Boolean(dto.repeatFinding),
      recurrence_category: dto.recurrenceCategory ?? null,
      classification_rationale: dto.classificationRationale ?? null,
      owner_user_id: dto.ownerUserId ?? null,
      reviewer_user_id: dto.reviewerUserId ?? null,
      responsible_department_id: dto.responsibleDepartmentId ?? null,
      escalation_owner_user_id: dto.escalationOwnerUserId ?? null,
      due_date: dto.dueDate ?? null,
      due_date_basis: dto.dueDateBasis ?? null,
      target_closure_date: dto.targetClosureDate ?? null,
      sla_category: dto.slaCategory ?? null,
      capa_required: Boolean(dto.capaRequired),
      capa_required_reason: dto.capaRequiredReason ?? null,
      suggested_corrective_action: dto.suggestedCorrectiveAction ?? null,
      suggested_preventive_action: dto.suggestedPreventiveAction ?? null,
      immediate_containment_needed: Boolean(dto.immediateContainmentNeeded),
      action_owner_recommendation: dto.actionOwnerRecommendation ?? null,
      action_due_date_recommendation: dto.actionDueDateRecommendation ?? null,
      verification_required_foundation: Boolean(dto.verificationRequiredFoundation),
      effectiveness_check_required_foundation: Boolean(dto.effectivenessCheckRequiredFoundation),
      source_snapshot_json: dto.sourceSnapshot ?? null,
      created_by: user.id,
      updated_by: user.id,
    };
  }

  private findingPatch(user: RequestUser, dto: Row, scoped: Row) {
    const patch: Row = { updated_by: user.id, updated_at: new Date().toISOString() };
    const map: Record<string, string> = {
      findingTitle: "finding_title",
      findingDescription: "finding_description",
      findingType: "finding_type",
      findingStatus: "finding_status",
      reviewStatus: "review_status",
      severity: "severity",
      priority: "priority",
      riskPotential: "risk_potential",
      criticality: "criticality",
      recurrenceCategory: "recurrence_category",
      classificationRationale: "classification_rationale",
      ownerUserId: "owner_user_id",
      reviewerUserId: "reviewer_user_id",
      responsibleDepartmentId: "responsible_department_id",
      escalationOwnerUserId: "escalation_owner_user_id",
      dueDate: "due_date",
      dueDateBasis: "due_date_basis",
      targetClosureDate: "target_closure_date",
      slaCategory: "sla_category",
      capaRequiredReason: "capa_required_reason",
      suggestedCorrectiveAction: "suggested_corrective_action",
      suggestedPreventiveAction: "suggested_preventive_action",
      actionOwnerRecommendation: "action_owner_recommendation",
      actionDueDateRecommendation: "action_due_date_recommendation",
    };
    for (const [input, column] of Object.entries(map)) if (dto[input] !== undefined) patch[column] = dto[input] ?? null;
    for (const [input, column] of Object.entries({ safetyCritical: "safety_critical", regulatoryCritical: "regulatory_critical", psmCritical: "psm_critical", immediateConcern: "immediate_concern", stopWorkRecommended: "stop_work_recommended", repeatFinding: "repeat_finding", capaRequired: "capa_required", immediateContainmentNeeded: "immediate_containment_needed", verificationRequiredFoundation: "verification_required_foundation", effectivenessCheckRequiredFoundation: "effectiveness_check_required_foundation" })) {
      if (dto[input] !== undefined) patch[column] = Boolean(dto[input]);
    }
    for (const [key, value] of Object.entries(scoped)) patch[key] = value;
    return patch;
  }

  private async resolveScope(user: RequestUser, dto: Row) {
    const siteId = dto.siteId ?? dto.site_id ?? user.selectedSiteId ?? null;
    if (siteId) this.assertSite(user, siteId);
    return {
      site_id: siteId,
      unit_id: dto.unitId ?? dto.unit_id ?? null,
      area_id: dto.areaId ?? dto.area_id ?? null,
      equipment_id: dto.equipmentId ?? dto.equipment_id ?? null,
      program_id: dto.programId ?? dto.program_id ?? null,
      plan_id: dto.planId ?? dto.plan_id ?? null,
      execution_id: dto.executionId ?? dto.execution_id ?? null,
      checklist_id: dto.checklistId ?? dto.checklist_id ?? null,
    };
  }

  private validateSource(dto: Row, settings: Row) {
    const sourceType = dto.sourceType ?? "Manual Finding";
    if (settings.require_source_for_finding && !sourceType) throw new BadRequestException("Finding source is required.");
    if (sourceType === "Manual Finding" && settings.require_manual_source_reason && !dto.manualSourceReason && !dto.sourceDescription) {
      throw new BadRequestException("Manual finding source reason is required.");
    }
  }

  private validateTransition(finding: Row, action: string, dto: Row, evidence: Row[], sources: Row[], settings: Row) {
    const blockers: string[] = [];
    if (action === "confirm") {
      if (!finding.finding_description) blockers.push("Confirmation requires finding description.");
      if (settings.require_classification_for_confirmation && !finding.finding_type) blockers.push("Confirmation requires finding type.");
      if (settings.require_classification_for_confirmation && !finding.severity) blockers.push("Confirmation requires severity.");
      if (settings.require_classification_for_confirmation && !finding.criticality) blockers.push("Confirmation requires criticality.");
      if (settings.require_source_for_finding && !sources.length) blockers.push("Confirmation requires a valid source link.");
      if (settings.require_evidence_for_confirmation && !evidence.length) blockers.push("Confirmation requires evidence or an approved exception.");
      if (settings.block_confirmation_on_potential_duplicate && finding.duplicate_repeat_status === "Potential Duplicate") blockers.push("Potential duplicate must be resolved or overridden.");
    }
    if (action === "mark-ready-for-capa") {
      if (finding.finding_status !== "Confirmed") blockers.push("Ready For CAPA requires confirmed status.");
      if (settings.require_owner_for_ready_capa && !finding.owner_user_id) blockers.push("Ready For CAPA requires owner.");
      if (settings.require_due_date_for_ready_capa && !finding.due_date) blockers.push("Ready For CAPA requires due date.");
      if (finding.capa_required === null || finding.capa_required === undefined) blockers.push("Ready For CAPA requires CAPA required decision.");
    }
    if (["reject", "reopen", "archive"].includes(action) && !dto.reason) blockers.push(`${action} requires reason.`);
    if (blockers.length) throw new BadRequestException(blockers.join(" "));
    return { status: "Passed", blockers };
  }

  private calculateReadinessPayload(finding: Row, evidence: Row[], sources: Row[]) {
    const blockers: string[] = [];
    const warnings: string[] = [];
    if (!finding.finding_title) blockers.push("Finding title is missing.");
    if (!sources.length) blockers.push("Finding source is missing.");
    if (!finding.finding_description) warnings.push("Finding description is missing.");
    if (!finding.finding_type || !finding.severity || !finding.criticality) warnings.push("Classification, severity, or criticality is incomplete.");
    if (!finding.owner_user_id) warnings.push("Owner is not assigned.");
    if (!finding.due_date) warnings.push("Due date is not assigned.");
    if (finding.evidence_status === "Missing") warnings.push("Evidence is missing.");
    if (finding.duplicate_repeat_status === "Potential Duplicate") warnings.push("Potential duplicate requires decision.");
    const evidenceStatus = evidence.length ? (evidence.some((row) => row.confidentiality_level === "Restricted") ? "Restricted" : "Linked") : (finding.evidence_status === "Not Required" ? "Not Required" : "Missing");
    let capaReadinessStatus = "Not Ready";
    if (!finding.finding_type || !finding.severity || !finding.criticality) capaReadinessStatus = "Missing Classification";
    else if (!finding.owner_user_id) capaReadinessStatus = "Missing Owner";
    else if (!finding.due_date) capaReadinessStatus = "Missing Due Date";
    else if (evidenceStatus === "Missing") capaReadinessStatus = "Missing Evidence";
    else if (finding.finding_status !== "Confirmed") capaReadinessStatus = "Needs Confirmation";
    else capaReadinessStatus = "Ready For CAPA";
    return {
      status: blockers.length ? "Blocked" : warnings.length ? "Warning" : "Complete",
      blockers,
      warnings,
      evidenceStatus,
      capaReadinessStatus,
      readyForCapa: capaReadinessStatus === "Ready For CAPA",
      missingData: [...blockers, ...warnings],
    };
  }

  private sectionPayload(user: RequestUser, finding: Row, section: string, dto: Row) {
    const base = { company_id: user.tenantId, site_id: finding.site_id, finding_id: finding.id, updated_at: new Date().toISOString() };
    if (section === "source") return {
      ...base,
      source_type: dto.sourceType,
      source_module: dto.sourceModule ?? "Audit Finding Register",
      source_record_id: dto.sourceRecordId ?? null,
      execution_id: dto.executionId ?? finding.execution_id ?? null,
      execution_section_id: dto.executionSectionId ?? null,
      execution_item_id: dto.executionItemId ?? null,
      response_id: dto.responseId ?? null,
      field_finding_id: dto.fieldFindingId ?? null,
      field_note_id: dto.fieldNoteId ?? null,
      evidence_id: dto.evidenceId ?? null,
      interview_id: dto.interviewId ?? null,
      walkthrough_id: dto.walkthroughId ?? null,
      source_description: dto.sourceDescription ?? null,
      manual_source_reason: dto.manualSourceReason ?? null,
      source_snapshot_json: dto.sourceSnapshot ?? null,
      primary_source: dto.primarySource ?? false,
      linked_by: user.id,
    };
    if (section === "standards") return { ...base, standard_name: dto.standardName, jurisdiction: dto.jurisdiction ?? null, clause_reference: dto.clauseReference ?? null, requirement_category: dto.requirementCategory ?? null, compliance_obligation: dto.complianceObligation ?? null, evidence_expectation: dto.evidenceExpectation ?? null, regulatory_register_id: dto.regulatoryRegisterId ?? null, checklist_standard_id: dto.checklistStandardId ?? null, source_from_checklist: Boolean(dto.sourceFromChecklist), notes: dto.notes ?? null, created_by: user.id };
    if (section === "modules") return { ...base, module_key: dto.moduleKey, module_name: dto.moduleName, related_record_id: dto.relatedRecordId ?? null, related_record_title: dto.relatedRecordTitle ?? null, relationship_type: dto.relationshipType ?? "Finding affects module", impact_description: dto.impactDescription ?? null, integration_status: dto.integrationStatus ?? null, created_by: user.id };
    if (section === "evidence") return { ...base, evidence_title: dto.evidenceTitle, evidence_type: dto.evidenceType, evidence_description: dto.evidenceDescription ?? null, document_id: dto.documentId ?? null, storage_file_id: dto.storageFileId ?? null, execution_evidence_id: dto.executionEvidenceId ?? null, related_module: dto.relatedModule ?? null, related_record_id: dto.relatedRecordId ?? null, confidentiality_level: dto.confidentialityLevel ?? null, evidence_status: dto.evidenceStatus ?? "Linked", uploaded_by: dto.uploadedBy ?? null, linked_by: user.id };
    if (section === "ownership") return { ...base, owner_user_id: dto.ownerUserId, ownership_role: dto.ownershipRole ?? "Owner", assigned_by: user.id, assignment_reason: dto.assignmentReason ?? null, due_date: dto.dueDate ?? null, status: dto.status ?? "Active" };
    if (section === "capa-foundation") return { ...base, capa_required: Boolean(dto.capaRequired), capa_readiness_status: dto.capaReadinessStatus ?? finding.capa_readiness_status, action_engine_record_id: dto.actionEngineRecordId ?? null, capa_record_id: dto.capaRecordId ?? null, suggested_corrective_action: dto.suggestedCorrectiveAction ?? null, suggested_preventive_action: dto.suggestedPreventiveAction ?? null, immediate_containment_needed: Boolean(dto.immediateContainmentNeeded), verification_required_foundation: Boolean(dto.verificationRequiredFoundation), effectiveness_check_required_foundation: Boolean(dto.effectivenessCheckRequiredFoundation), link_status: dto.linkStatus ?? "Foundation", created_by: user.id };
    throw new BadRequestException("Unsupported finding section.");
  }

  private async savePrimarySource(user: RequestUser, finding: Row, dto: Row, settings: Row) {
    if (!settings.require_source_for_finding && !dto.sourceType) return;
    await this.upsertSection(user, finding.id, "source", {
      sourceType: dto.sourceType ?? "Manual Finding",
      sourceModule: dto.sourceModule ?? "Audit Finding Register",
      sourceRecordId: dto.sourceRecordId ?? null,
      executionId: dto.executionId ?? null,
      executionSectionId: dto.executionSectionId ?? null,
      executionItemId: dto.executionItemId ?? null,
      responseId: dto.responseId ?? null,
      fieldFindingId: dto.fieldFindingId ?? null,
      fieldNoteId: dto.fieldNoteId ?? null,
      sourceDescription: dto.sourceDescription ?? null,
      manualSourceReason: dto.manualSourceReason ?? null,
      sourceSnapshot: dto.sourceSnapshot ?? finding.source_snapshot_json ?? null,
      primarySource: true,
    });
  }

  private async applyOptionalSections(user: RequestUser, finding: Row, dto: Row) {
    if (dto.standardName) await this.upsertSection(user, finding.id, "standards", dto);
    if (dto.moduleKey) await this.upsertSection(user, finding.id, "modules", dto);
    if (dto.evidenceTitle) await this.upsertSection(user, finding.id, "evidence", dto);
    if (dto.ownerUserId) await this.upsertSection(user, finding.id, "ownership", { ownerUserId: dto.ownerUserId, dueDate: dto.dueDate, assignmentReason: "Assigned during finding creation" });
    if (dto.capaRequired !== undefined) await this.upsertSection(user, finding.id, "capa-foundation", dto);
  }

  private async nextCode(user: RequestUser, siteId: string | null) {
    let query: any = this.db.from("audit_findings").select("id", { count: "exact", head: true }).eq("company_id", user.tenantId);
    query = siteId ? query.eq("site_id", siteId) : query.is("site_id", null);
    const { count, error } = await query;
    if (error) throw new BadRequestException(error.message);
    return `AF-${new Date().getFullYear()}-${String((count ?? 0) + 1).padStart(6, "0")}`;
  }

  private async finding(user: RequestUser, id: string) {
    const row = await this.safeSingle(this.db.from("audit_findings").select("*").eq("company_id", user.tenantId).eq("id", id).maybeSingle());
    if (!row) throw new NotFoundException("Audit finding not found.");
    if (row.site_id) this.assertSite(user, row.site_id);
    return row;
  }

  private async record(table: string, user: RequestUser, column: string, value: string) {
    const row = await this.safeSingle(this.db.from(table).select("*").eq("company_id", user.tenantId).eq(column, value).maybeSingle());
    if (!row) throw new NotFoundException("Record not found.");
    if (row.site_id) this.assertSite(user, row.site_id);
    return row;
  }

  private findingChildren(table: string, finding: Row, order = "created_at") {
    return this.safeRows(this.db.from(table).select("*").eq("company_id", finding.company_id).eq("finding_id", finding.id).order(order, { ascending: true }));
  }

  private sectionTable(section: string) {
    const tables: Record<string, string> = {
      source: "audit_finding_sources",
      standards: "audit_finding_standard_links",
      modules: "audit_finding_module_links",
      evidence: "audit_finding_evidence_links",
      ownership: "audit_finding_ownership_records",
      "capa-foundation": "audit_finding_capa_foundation_links",
    };
    const table = tables[section];
    if (!table) throw new BadRequestException("Unsupported finding section.");
    return table;
  }

  private sectionTitle(section: string) {
    return section.split("-").map((part) => part[0]?.toUpperCase() + part.slice(1)).join(" ");
  }

  private settingsPatch(dto: Row) {
    const patch: Row = {};
    for (const [input, column] of Object.entries({
      requireSourceForFinding: "require_source_for_finding",
      allowManualFindings: "allow_manual_findings",
      requireManualSourceReason: "require_manual_source_reason",
      requireClassificationForConfirmation: "require_classification_for_confirmation",
      requireOwnerForReadyCapa: "require_owner_for_ready_capa",
      requireDueDateForReadyCapa: "require_due_date_for_ready_capa",
      requireEvidenceForConfirmation: "require_evidence_for_confirmation",
      requireReviewForSafetyCritical: "require_review_for_safety_critical",
      requireReviewForRegulatoryCritical: "require_review_for_regulatory_critical",
      requireReviewForPsmCritical: "require_review_for_psm_critical",
      autoCheckDuplicates: "auto_check_duplicates",
      blockConfirmationOnPotentialDuplicate: "block_confirmation_on_potential_duplicate",
      autoMarkOverdue: "auto_mark_overdue",
      autoNotifyOwnerOnAssignment: "auto_notify_owner_on_assignment",
      autoNotifyLeadOnSafetyCritical: "auto_notify_lead_on_safety_critical",
      autoCreateCapaFoundationForConfirmed: "auto_create_capa_foundation_for_confirmed",
      settingsJson: "settings_json",
    })) {
      if (dto[input] !== undefined) patch[column] = dto[input];
    }
    if (dto.duplicateCheckWindowDays !== undefined) patch.duplicate_check_window_days = Number(dto.duplicateCheckWindowDays);
    return patch;
  }

  private normalizeFieldFindingType(type?: string | null) {
    if (!type) return "Observation";
    if (type === "Safety Critical Finding") return "Safety-Critical Gap";
    if (type === "Regulatory Finding") return "Regulatory Gap";
    if (type === "Non-Compliance") return "Non-Conformance";
    return findingTypes.includes(type) ? type : "Observation";
  }

  private group(rows: Row[], key: string) {
    return Object.values(rows.reduce((acc: Record<string, Row>, row) => {
      const value = row[key] ?? "Unassigned";
      acc[value] = acc[value] ?? { key: value, label: value, count: 0 };
      acc[value].count += 1;
      return acc;
    }, {}));
  }

  private summary(rows: Row[]) {
    return {
      total: rows.length,
      open: rows.filter((row) => row.finding_status === "Open").length,
      draft: rows.filter((row) => row.finding_status === "Draft").length,
      underReview: rows.filter((row) => row.finding_status === "Under Review").length,
      confirmed: rows.filter((row) => row.finding_status === "Confirmed").length,
      rejected: rows.filter((row) => row.finding_status === "Rejected").length,
      needsMoreInformation: rows.filter((row) => row.finding_status === "Needs More Information").length,
      readyForCapa: rows.filter((row) => row.ready_for_capa || row.capa_readiness_status === "Ready For CAPA").length,
      awaitingOwner: rows.filter((row) => !row.owner_user_id && !CLOSED_STATUSES.includes(row.finding_status)).length,
      overdue: rows.filter((row) => this.isOverdue(row)).length,
      safetyCritical: rows.filter((row) => row.safety_critical).length,
      regulatoryCritical: rows.filter((row) => row.regulatory_critical).length,
      psmCritical: rows.filter((row) => row.psm_critical).length,
      highPriority: rows.filter((row) => ["High", "Urgent", "Immediate"].includes(row.priority)).length,
      repeatFindings: rows.filter((row) => row.repeat_finding).length,
      fromFieldAudit: rows.filter((row) => row.execution_id).length,
      missingEvidence: rows.filter((row) => row.evidence_status === "Missing").length,
      withCapaFoundation: rows.filter((row) => row.capa_record_id || row.capa_readiness_status === "CAPA Created Foundation").length,
      recentlyCreated: rows.filter((row) => this.daysAgo(row.created_at) <= 14).length,
      recentlyConfirmed: rows.filter((row) => row.confirmed_at && this.daysAgo(row.confirmed_at) <= 14).length,
    };
  }

  private isOverdue(row: Row) {
    if (!row.due_date || CLOSED_STATUSES.includes(row.finding_status)) return false;
    return new Date(row.due_date).getTime() < Date.now();
  }

  private daysAgo(value: string) {
    return Math.floor((Date.now() - new Date(value).getTime()) / 86400000);
  }

  private async event(user: RequestUser, finding: Row, title: string, description: string, before: Row | null, after: Row | null) {
    await this.history.write({
      tenantId: user.tenantId,
      siteId: finding.site_id,
      unitId: finding.unit_id,
      areaId: finding.area_id,
      programId: finding.program_id,
      planId: finding.plan_id,
      executionId: finding.execution_id,
      findingId: finding.id,
      fieldFindingId: finding.field_finding_id ?? null,
      actorId: user.id,
      type: title,
      title,
      description,
      before,
      after,
    });
  }

  private assertEditable(finding: Row) {
    if (LOCKED_STATUSES.includes(finding.finding_status)) throw new ForbiddenException("Confirmed, rejected, ready for CAPA, CAPA foundation, and archived findings are read-only unless reopened.");
  }

  private assertSite(user: RequestUser, siteId: string) {
    if (user.isSuperAdmin || user.isCompanyAdmin || user.corporateView) return;
    if (!user.siteIds.includes(siteId)) throw new ForbiddenException("Audit finding site is outside your site access.");
  }

  private filterSites(user: RequestUser, rows: Row[]) {
    if (user.isSuperAdmin || user.isCompanyAdmin || user.corporateView) return rows;
    return rows.filter((site) => user.siteIds.includes(site.id));
  }

  private truthy(value: unknown) {
    return value === true || value === "true" || value === "1" || value === 1;
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
}
