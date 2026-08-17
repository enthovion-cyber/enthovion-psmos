import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { createHash, randomUUID } from "node:crypto";
import { RequestUser } from "../common/decorators/current-user.decorator";
import { SupabaseService } from "../database/supabase.service";
import { AuditReviewHistoryService } from "./audit-review-history.service";

type Row = Record<string, any>;

const PACKAGE_STATUSES = ["Draft", "Submitted", "In Review", "Returned", "Rejected", "Approved", "Approved With Conditions", "Completed", "Escalated", "Stale", "Validation Failed", "Cancelled", "Archived"];
const STAGE_STATUSES = ["Pending", "Active", "Completed", "Returned", "Rejected", "Skipped", "Overdue"];
const DECISIONS = ["Approve", "Approve With Conditions", "Reject", "Return", "Request Info", "Delegate", "Reassign", "Escalate", "Cancel", "Resubmit", "E-Sign"];
const VALIDATION_STATUSES = ["Not Run", "Passed", "Warning", "Failed", "Override Required"];
const RULE_TRIGGERS = ["Manual", "Submit For Review", "Status Change", "Safety Critical", "Regulatory Critical", "PSM Critical", "Evidence Verified", "Score Locked", "Mapping Verified", "CAPA Closure"];
const SOURCE_MODULES = ["Program", "Plan", "Checklist", "Execution", "Finding", "CAPA", "Evidence", "Scoring", "Standards Mapping"];
const CONDITION_STATUSES = ["Open", "In Progress", "Completed", "Verified", "Rejected", "Waived"];

const SOURCE_CONFIG: Record<string, { table: string; code: string; title: string; status: string; type: string }> = {
  program: { table: "audit_programs", code: "program_code", title: "program_title", status: "program_status", type: "Program" },
  plan: { table: "audit_plans", code: "plan_code", title: "plan_title", status: "plan_status", type: "Plan" },
  checklist: { table: "audit_checklist_templates", code: "checklist_code", title: "checklist_title", status: "checklist_status", type: "Checklist" },
  execution: { table: "audit_executions", code: "execution_code", title: "execution_title", status: "execution_status", type: "Execution" },
  finding: { table: "audit_findings", code: "finding_code", title: "finding_title", status: "finding_status", type: "Finding" },
  capa: { table: "audit_capa_records", code: "capa_code", title: "capa_title", status: "capa_status", type: "CAPA" },
  evidence: { table: "audit_evidence_records", code: "evidence_code", title: "evidence_title", status: "evidence_status", type: "Evidence" },
  "score-run": { table: "audit_score_runs", code: "run_code", title: "run_title", status: "run_status", type: "Scoring" },
  scoring: { table: "audit_score_runs", code: "run_code", title: "run_title", status: "run_status", type: "Scoring" },
  "standards-mapping": { table: "audit_standard_mappings", code: "mapping_code", title: "mapping_title", status: "mapping_status", type: "Standards Mapping" },
};

@Injectable()
export class AuditReviewApprovalService {
  constructor(
    private readonly db: SupabaseService,
    private readonly history: AuditReviewHistoryService,
  ) {}

  lookups() {
    return {
      packageStatuses: PACKAGE_STATUSES,
      stageStatuses: STAGE_STATUSES,
      approvalDecisions: DECISIONS,
      validationStatuses: VALIDATION_STATUSES,
      ruleTriggers: RULE_TRIGGERS,
      sourceModules: SOURCE_MODULES,
      reviewerSelectionMethods: ["Named User", "Role", "Site Role", "Owner", "Lead Auditor", "Manager", "System Suggested"],
      conditionStatuses: CONDITION_STATUSES,
      participantStatuses: ["Assigned", "Pending", "Completed", "Delegated", "Reassigned", "Declined", "Overdue"],
      staleStatuses: ["Current", "Stale", "Refresh Required", "Resolved"],
      signatureStatuses: ["Not Required", "Pending", "Signed", "Failed", "Expired"],
    };
  }

  async dashboard(user: RequestUser, query: Row = {}) {
    const packages = await this.packages(user, { ...query, page: 1, limit: 1000 });
    const rows = packages.rows;
    const inbox = await this.inbox(user, { ...query, page: 1, limit: 1000 });
    const rules = await this.rules(user, { ...query, page: 1, limit: 1000 });
    const pending = rows.filter((row) => ["Submitted", "In Review"].includes(row.package_status));
    const overdue = rows.filter((row) => this.isOverdue(row));
    const validationFailures = rows.filter((row) => row.validation_status === "Failed" || row.package_status === "Validation Failed");
    const esignPending = rows.filter((row) => row.e_signature_required || row.esignature_pending_count > 0);
    return {
      summary: this.summary(rows),
      inboxPreview: inbox.rows.slice(0, 8),
      pendingByModule: this.group(rows, "source_module"),
      overdueApprovals: overdue,
      stalePackages: rows.filter((row) => row.stale_status !== "Current"),
      validationFailures,
      esignaturePending: esignPending,
      safetyCriticalApprovals: rows.filter((row) => row.safety_critical),
      regulatoryCriticalApprovals: rows.filter((row) => row.regulatory_critical),
      workloadByReviewer: await this.reviewerWorkload(user),
      cycleTimeByModule: this.cycleTime(rows),
      returnedRejectedTrends: rows.filter((row) => ["Returned", "Rejected"].includes(row.package_status)).slice(0, 12),
      recentApprovals: rows.filter((row) => ["Approved", "Completed"].includes(row.package_status)).slice(0, 12),
      recentRejections: rows.filter((row) => row.package_status === "Rejected").slice(0, 12),
      reportReady: rows.filter((row) => row.report_ready),
      rules: rules.rows,
    };
  }

  async dashboardSummary(user: RequestUser, query: Row = {}) {
    const dashboard = await this.dashboard(user, query);
    return dashboard.summary;
  }

  inbox(user: RequestUser, query: Row = {}) {
    return this.packages(user, { ...query, reviewerUserId: user.id, participantStatuses: "Assigned,Pending,Overdue" });
  }

  submissions(user: RequestUser, query: Row = {}) {
    return this.packages(user, { ...query, submittedBy: user.id });
  }

  view(user: RequestUser, filter: string, query: Row = {}) {
    const scoped = { ...query };
    if (filter === "pending") scoped.statuses = "Submitted,In Review";
    if (filter === "overdue") scoped.overdue = true;
    if (filter === "returned") scoped.status = "Returned";
    if (filter === "rejected") scoped.status = "Rejected";
    if (filter === "approved") scoped.status = "Approved";
    if (filter === "approved-with-conditions") scoped.status = "Approved With Conditions";
    if (filter === "completed") scoped.status = "Completed";
    if (filter === "escalated") scoped.status = "Escalated";
    if (filter === "stale") scoped.staleStatus = "Stale";
    if (filter === "validation-failures") scoped.validationStatus = "Failed";
    if (filter === "e-signatures") scoped.esignatureRequired = true;
    return this.packages(user, scoped);
  }

  async packages(user: RequestUser, query: Row = {}) {
    const page = Math.max(1, Number(query.page ?? 1));
    const limit = Math.min(250, Math.max(1, Number(query.limit ?? 25)));
    let request: any = this.db.from("audit_approval_packages").select("*", { count: "exact" }).eq("company_id", user.tenantId);
    if (!this.truthy(query.includeArchived)) request = request.is("archived_at", null);
    const siteId = query.siteId ?? user.selectedSiteId;
    if (siteId) {
      this.assertSite(user, String(siteId));
      request = request.eq("site_id", siteId);
    } else if (user.selectedSiteId && !user.corporateView) request = request.eq("site_id", user.selectedSiteId);
    if (query.status) request = request.eq("package_status", query.status);
    if (query.statuses) request = request.in("package_status", String(query.statuses).split(",").map((item) => item.trim()).filter(Boolean));
    if (query.validationStatus) request = request.eq("validation_status", query.validationStatus);
    if (query.staleStatus) request = request.eq("stale_status", query.staleStatus);
    if (query.sourceModule) request = request.eq("source_module", query.sourceModule);
    if (query.sourceRecordId) request = request.eq("source_record_id", query.sourceRecordId);
    if (query.unitId) request = request.eq("unit_id", query.unitId);
    if (query.areaId) request = request.eq("area_id", query.areaId);
    if (query.submittedBy) request = request.eq("submitted_by", query.submittedBy);
    if (this.truthy(query.esignatureRequired)) request = request.or("safety_critical.eq.true,regulatory_critical.eq.true,psm_critical.eq.true");
    if (query.search) {
      const search = String(query.search).replace(/[,%()]/g, " ").trim();
      if (search) request = request.or(`package_number.ilike.%${search}%,package_title.ilike.%${search}%,source_record_number.ilike.%${search}%,source_record_title.ilike.%${search}%`);
    }
    const sort = String(query.sort ?? "updated_at.desc");
    const [sortColumn, direction] = sort.split(".");
    const { data, count, error } = await request.order(sortColumn || "updated_at", { ascending: direction === "asc" }).range((page - 1) * limit, page * limit - 1);
    if (error) throw new BadRequestException(error.message);
    let rows: Row[] = ((data ?? []) as Row[]).filter((row: Row) => this.canSeeSite(user, row.site_id));
    if (query.reviewerUserId) {
      const participantRows = await this.safeRows(this.db.from("audit_approval_participants").select("approval_id,participant_status").eq("company_id", user.tenantId).eq("reviewer_user_id", query.reviewerUserId));
      const statuses = query.participantStatuses ? String(query.participantStatuses).split(",").map((item) => item.trim()) : [];
      const allowed = new Set(participantRows.filter((row: Row) => !statuses.length || statuses.includes(row.participant_status)).map((row: Row) => row.approval_id));
      rows = rows.filter((row: Row) => allowed.has(row.id));
    }
    if (this.truthy(query.overdue)) rows = rows.filter((row: Row) => this.isOverdue(row));
    const enriched: Row[] = await Promise.all(rows.map((row: Row) => this.enrichPackage(user, row)));
    return { rows: enriched, total: count ?? enriched.length, page, limit, summary: this.summary(enriched) };
  }

  async detail(user: RequestUser, approvalId: string) {
    const approval = await this.package(user, approvalId);
    const [stages, participants, decisions, conditions, validation, evidence, esignatures, escalations, staleness, history, settings] = await Promise.all([
      this.children(user, "audit_approval_stages", approvalId, "approval_id", "stage_order", true),
      this.children(user, "audit_approval_participants", approvalId, "approval_id", "assigned_at", true),
      this.children(user, "audit_approval_decisions", approvalId, "approval_id", "decided_at", false),
      this.children(user, "audit_approval_conditions", approvalId, "approval_id", "created_at", true),
      this.children(user, "audit_approval_validation_results", approvalId, "approval_id", "validated_at", false),
      this.children(user, "audit_approval_evidence_links", approvalId, "approval_id", "linked_at", false),
      this.children(user, "audit_approval_esignature_links", approvalId, "approval_id", "created_at", false),
      this.children(user, "audit_approval_escalations", approvalId, "approval_id", "escalated_at", false),
      this.children(user, "audit_approval_staleness_events", approvalId, "approval_id", "detected_at", false),
      this.children(user, "audit_approval_history_events", approvalId, "approval_id", "created_at", false),
      this.settings(user, approval.site_id ?? null),
    ]);
    const validationChecks = this.validationChecks(approval, validation);
    return {
      approval: await this.enrichPackage(user, approval),
      source: this.sourcePanel(approval),
      snapshot: approval.source_snapshot_json,
      evidence,
      validation,
      validationChecks,
      stages,
      participants,
      decisions,
      esignatures,
      conditions,
      history,
      escalations,
      staleness,
      settings,
      readiness: this.readiness(approval, validationChecks, stages, participants, conditions, settings),
    };
  }

  async section(user: RequestUser, approvalId: string, section: string) {
    const detail = await this.detail(user, approvalId);
    if (section === "source") return detail.source;
    if (section === "snapshot") return detail.snapshot;
    if (section === "evidence") return detail.evidence;
    if (section === "validation") return { rows: detail.validation, checks: detail.validationChecks, readiness: detail.readiness };
    if (section === "stages") return detail.stages;
    if (section === "decisions") return detail.decisions;
    if (section === "e-signatures") return detail.esignatures;
    if (section === "conditions") return detail.conditions;
    if (section === "history") return detail.history;
    return detail;
  }

  async createPackage(user: RequestUser, dto: Row) {
    const sourceModule = this.normalizeSource(dto.sourceModule ?? dto.source_module);
    const sourceRecordId = String(dto.sourceRecordId ?? dto.source_record_id ?? "");
    if (!sourceModule || !sourceRecordId) throw new BadRequestException("Source module and source record are required.");
    const source = await this.sourceRow(user, sourceModule, sourceRecordId);
    const siteId = dto.siteId ?? dto.site_id ?? source.site_id ?? user.selectedSiteId ?? null;
    if (siteId) this.assertSite(user, String(siteId));
    const settings = await this.settings(user, siteId);
    const hash = this.hash(source);
    const packageNumber = dto.packageNumber ?? dto.package_number ?? await this.nextPackageNumber(user, siteId);
    const dueAt = dto.dueAt ?? dto.due_at ?? this.dueDate(settings.default_sla_days ?? 7);
    const payload = this.withoutUndefined({
      company_id: user.tenantId,
      site_id: siteId,
      unit_id: dto.unitId ?? dto.unit_id ?? source.unit_id ?? null,
      area_id: dto.areaId ?? dto.area_id ?? source.area_id ?? null,
      package_number: packageNumber,
      package_title: dto.packageTitle ?? dto.package_title ?? `${this.sourceLabel(sourceModule)} review - ${source[this.titleColumn(sourceModule)] ?? sourceRecordId}`,
      package_description: dto.packageDescription ?? dto.package_description ?? null,
      source_module: this.sourceLabel(sourceModule),
      source_object_type: SOURCE_CONFIG[sourceModule]?.type ?? sourceModule,
      source_record_id: sourceRecordId,
      source_record_number: source[this.codeColumn(sourceModule)] ?? null,
      source_record_title: source[this.titleColumn(sourceModule)] ?? null,
      source_record_status: source[this.statusColumn(sourceModule)] ?? null,
      source_snapshot_json: source,
      source_snapshot_hash: hash,
      package_status: dto.packageStatus ?? dto.package_status ?? "Draft",
      priority: dto.priority ?? source.priority ?? "Normal",
      criticality: dto.criticality ?? source.criticality ?? "Normal",
      safety_critical: this.bool(dto.safetyCritical ?? dto.safety_critical, Boolean(source.safety_critical)),
      regulatory_critical: this.bool(dto.regulatoryCritical ?? dto.regulatory_critical, Boolean(source.regulatory_critical)),
      psm_critical: this.bool(dto.psmCritical ?? dto.psm_critical, Boolean(source.psm_critical)),
      validation_status: "Not Run",
      stale_status: "Current",
      due_at: dueAt,
      submitted_by: null,
      submitted_at: null,
      created_by: user.id,
      updated_by: user.id,
    });
    const created = await this.db.single<Row>(this.db.from("audit_approval_packages").insert(payload).select().single());
    await this.createInitialStages(user, created, dto);
    await this.write(user, created, "Audit Approval Package Created", "Immutable source snapshot created for review.", null, created);
    return this.detail(user, created.id);
  }

  async sourceSubmit(user: RequestUser, sourceModule: string, sourceRecordId: string, dto: Row = {}) {
    const detail: Row = await this.createPackage(user, { ...dto, sourceModule, sourceRecordId, packageStatus: "Draft" });
    return this.transition(user, detail.approval.id, "submit", dto);
  }

  async sourceReview(user: RequestUser, sourceModule: string, sourceRecordId: string, query: Row = {}) {
    return this.packages(user, { ...query, sourceModule: this.sourceLabel(this.normalizeSource(sourceModule)), sourceRecordId });
  }

  async transition(user: RequestUser, approvalId: string, action: string, dto: Row = {}) {
    const before = await this.package(user, approvalId);
    const settings = await this.settings(user, before.site_id ?? null);
    if (["reject", "return", "cancel", "delegate", "reassign", "escalate"].includes(action) && !String(dto.reason ?? dto.correctionInstructions ?? "").trim()) {
      throw new BadRequestException("Reason or correction instructions are required for this review action.");
    }
    if (action === "run-validation") return this.runValidation(user, approvalId, dto);
    if (action === "refresh-snapshot") return this.refreshSnapshot(user, approvalId, dto);
    if (action === "mark-stale") return this.markStale(user, approvalId, dto);
    if (action === "archive") return this.archive(user, approvalId, dto);
    if (action === "submit" || action === "resubmit") {
      await this.runValidation(user, approvalId, dto);
      const stages = await this.children(user, "audit_approval_stages", approvalId, "approval_id", "stage_order", true);
      if (!stages.length) await this.createInitialStages(user, before, dto);
      const firstStage = (await this.children(user, "audit_approval_stages", approvalId, "approval_id", "stage_order", true))[0] ?? null;
      const status = action === "resubmit" ? "Submitted" : "Submitted";
      const after = await this.updatePackage(user, before, {
        package_status: status,
        submitted_by: user.id,
        submitted_at: new Date().toISOString(),
        current_stage_id: firstStage?.id ?? null,
        current_stage_name: firstStage?.stage_name ?? null,
      });
      await this.write(user, after, action === "resubmit" ? "Audit Approval Package Resubmitted" : "Audit Approval Package Submitted", "Package submitted into backend controlled review workflow.", before, after);
      return this.detail(user, approvalId);
    }
    if (["approve", "approve-with-conditions", "reject", "return", "request-info", "delegate", "reassign", "escalate", "e-sign"].includes(action)) {
      await this.assertDecisionAllowed(user, before, action, settings, dto);
      const decision = await this.createDecision(user, before, action, dto);
      const statusMap: Row = {
        approve: "Approved",
        "approve-with-conditions": "Approved With Conditions",
        reject: "Rejected",
        return: "Returned",
        "request-info": "In Review",
        delegate: "In Review",
        reassign: "In Review",
        escalate: "Escalated",
        "e-sign": before.package_status,
      };
      if (action === "approve-with-conditions") await this.createConditionsFromDecision(user, before, decision, dto.conditions ?? dto.conditions_json ?? []);
      if (action === "e-sign") await this.linkEsignature(user, before, decision, dto);
      const after = await this.updatePackage(user, before, {
        package_status: statusMap[action] ?? before.package_status,
        completed_at: ["approve", "approve-with-conditions", "reject"].includes(action) ? new Date().toISOString() : before.completed_at ?? null,
        report_ready: ["approve", "approve-with-conditions"].includes(action) && settings.auto_lock_approved_records !== false,
        locked_source: ["approve", "approve-with-conditions"].includes(action) && settings.auto_lock_approved_records !== false,
      });
      await this.write(user, after, `Audit Approval ${this.titleCase(action)}`, dto.reason ?? dto.correctionInstructions ?? "Review action completed.", before, after);
      return this.detail(user, approvalId);
    }
    throw new BadRequestException(`Unsupported review action: ${action}`);
  }

  async addCondition(user: RequestUser, approvalId: string, dto: Row) {
    const approval = await this.package(user, approvalId);
    const payload = {
      company_id: user.tenantId,
      site_id: approval.site_id ?? null,
      approval_id: approvalId,
      condition_title: dto.conditionTitle ?? dto.condition_title ?? dto.title,
      condition_description: dto.conditionDescription ?? dto.condition_description ?? dto.description ?? null,
      condition_owner_user_id: dto.conditionOwnerUserId ?? dto.condition_owner_user_id ?? dto.ownerUserId ?? null,
      condition_status: dto.conditionStatus ?? dto.condition_status ?? "Open",
      blocking: this.bool(dto.blocking, true),
      due_at: dto.dueAt ?? dto.due_at ?? null,
      created_by: user.id,
    };
    if (!payload.condition_title) throw new BadRequestException("Condition title is required.");
    const row = await this.db.single<Row>(this.db.from("audit_approval_conditions").insert(payload).select().single());
    await this.write(user, approval, "Audit Approval Condition Added", "Approval condition added.", null, row);
    return row;
  }

  async updateCondition(user: RequestUser, approvalId: string, conditionId: string, dto: Row) {
    await this.package(user, approvalId);
    const before = await this.singleChild(user, "audit_approval_conditions", approvalId, conditionId);
    const payload = this.withoutUndefined({
      condition_title: dto.conditionTitle ?? dto.condition_title,
      condition_description: dto.conditionDescription ?? dto.condition_description,
      condition_owner_user_id: dto.conditionOwnerUserId ?? dto.condition_owner_user_id,
      condition_status: dto.conditionStatus ?? dto.condition_status,
      blocking: dto.blocking === undefined ? undefined : this.bool(dto.blocking, before.blocking),
      due_at: dto.dueAt ?? dto.due_at,
      updated_at: new Date().toISOString(),
    });
    const after = await this.db.single<Row>(this.db.from("audit_approval_conditions").update(payload).eq("company_id", user.tenantId).eq("approval_id", approvalId).eq("id", conditionId).select().single());
    await this.write(user, after, "Audit Approval Condition Updated", "Approval condition updated.", before, after);
    return after;
  }

  async conditionTransition(user: RequestUser, approvalId: string, conditionId: string, status: string, dto: Row = {}) {
    const payload: Row = { conditionStatus: status };
    if (status === "Completed") {
      payload.completed_at = new Date().toISOString();
      payload.completed_by = user.id;
    }
    if (status === "Verified") {
      payload.verified_at = new Date().toISOString();
      payload.verified_by = user.id;
      payload.verification_note = dto.reason ?? dto.verificationNote ?? null;
    }
    return this.updateCondition(user, approvalId, conditionId, { ...dto, ...payload });
  }

  async rules(user: RequestUser, query: Row = {}) {
    const page = Math.max(1, Number(query.page ?? 1));
    const limit = Math.min(250, Math.max(1, Number(query.limit ?? 25)));
    let request: any = this.db.from("audit_approval_rules").select("*", { count: "exact" }).eq("company_id", user.tenantId);
    if (!this.truthy(query.includeArchived)) request = request.is("archived_at", null);
    if (query.siteId) {
      this.assertSite(user, String(query.siteId));
      request = request.eq("site_id", query.siteId);
    }
    if (query.status) request = request.eq("rule_status", query.status);
    if (query.sourceModule) request = request.eq("source_module", query.sourceModule);
    if (query.search) {
      const search = String(query.search).replace(/[,%()]/g, " ").trim();
      if (search) request = request.or(`rule_code.ilike.%${search}%,rule_title.ilike.%${search}%,source_module.ilike.%${search}%`);
    }
    const { data, count, error } = await request.order("updated_at", { ascending: false }).range((page - 1) * limit, page * limit - 1);
    if (error) throw new BadRequestException(error.message);
    const rows = (data ?? []).filter((row: Row) => this.canSeeSite(user, row.site_id));
    return { rows, total: count ?? rows.length, page, limit };
  }

  async rule(user: RequestUser, ruleId: string) {
    const rule = await this.singleById(user, "audit_approval_rules", ruleId, "Review rule not found.");
    const stages = await this.children(user, "audit_approval_rule_stages", ruleId, "rule_id", "stage_order", true);
    return { rule, stages };
  }

  async saveRule(user: RequestUser, dto: Row, ruleId?: string) {
    const before = ruleId ? await this.singleById(user, "audit_approval_rules", ruleId, "Review rule not found.") : null;
    const siteId = dto.siteId ?? dto.site_id ?? before?.site_id ?? user.selectedSiteId ?? null;
    if (siteId) this.assertSite(user, String(siteId));
    const sourceModule = dto.sourceModule ?? dto.source_module ?? before?.source_module;
    const sourceObjectType = dto.sourceObjectType ?? dto.source_object_type ?? before?.source_object_type;
    const triggerEvent = dto.triggerEvent ?? dto.trigger_event ?? before?.trigger_event;
    const payload = this.withoutUndefined({
      company_id: user.tenantId,
      site_id: siteId,
      unit_id: dto.unitId ?? dto.unit_id ?? before?.unit_id ?? null,
      area_id: dto.areaId ?? dto.area_id ?? before?.area_id ?? null,
      rule_code: dto.ruleCode ?? dto.rule_code ?? before?.rule_code ?? await this.nextRuleCode(user),
      rule_title: dto.ruleTitle ?? dto.rule_title ?? before?.rule_title,
      rule_description: dto.ruleDescription ?? dto.rule_description ?? before?.rule_description ?? null,
      source_module: sourceModule,
      source_object_type: sourceObjectType,
      trigger_event: triggerEvent,
      criticality: dto.criticality ?? before?.criticality ?? null,
      safety_critical_only: this.bool(dto.safetyCriticalOnly ?? dto.safety_critical_only, before?.safety_critical_only ?? false),
      regulatory_critical_only: this.bool(dto.regulatoryCriticalOnly ?? dto.regulatory_critical_only, before?.regulatory_critical_only ?? false),
      psm_critical_only: this.bool(dto.psmCriticalOnly ?? dto.psm_critical_only, before?.psm_critical_only ?? false),
      required_validation_checks_json: dto.requiredValidationChecksJson ?? dto.required_validation_checks_json ?? dto.validationChecks ?? before?.required_validation_checks_json ?? null,
      reviewer_selection_json: dto.reviewerSelectionJson ?? dto.reviewer_selection_json ?? dto.reviewers ?? before?.reviewer_selection_json ?? null,
      e_signature_required: this.bool(dto.eSignatureRequired ?? dto.e_signature_required, before?.e_signature_required ?? false),
      sla_days: dto.slaDays ?? dto.sla_days ?? before?.sla_days ?? null,
      escalation_rule_json: dto.escalationRuleJson ?? dto.escalation_rule_json ?? dto.escalation ?? before?.escalation_rule_json ?? null,
      auto_lock_on_approval: this.bool(dto.autoLockOnApproval ?? dto.auto_lock_on_approval, before?.auto_lock_on_approval ?? true),
      auto_mark_report_ready: this.bool(dto.autoMarkReportReady ?? dto.auto_mark_report_ready, before?.auto_mark_report_ready ?? true),
      rule_status: dto.ruleStatus ?? dto.rule_status ?? before?.rule_status ?? "Draft",
      owner_user_id: dto.ownerUserId ?? dto.owner_user_id ?? before?.owner_user_id ?? user.id,
      created_by: before ? before.created_by : user.id,
      updated_by: user.id,
      updated_at: new Date().toISOString(),
    });
    if (!payload.rule_title || !payload.source_module || !payload.source_object_type || !payload.trigger_event) {
      throw new BadRequestException("Rule title, source module, source object type, and trigger event are required.");
    }
    const after = before
      ? await this.db.single<Row>(this.db.from("audit_approval_rules").update(payload).eq("company_id", user.tenantId).eq("id", ruleId).select().single())
      : await this.db.single<Row>(this.db.from("audit_approval_rules").insert(payload).select().single());
    await this.replaceRuleStages(user, after, dto.stages ?? dto.stages_json ?? []);
    await this.write(user, after, before ? "Audit Review Rule Updated" : "Audit Review Rule Created", "Audit review rule and stages saved.", before, after);
    return this.rule(user, after.id);
  }

  async ruleTransition(user: RequestUser, ruleId: string, action: "activate" | "archive", dto: Row = {}) {
    const before = await this.singleById(user, "audit_approval_rules", ruleId, "Review rule not found.");
    if (action === "archive" && !String(dto.reason ?? "").trim()) throw new BadRequestException("Archive reason is required.");
    const payload = action === "activate"
      ? { rule_status: "Active", archived_at: null, archived_by: null, archive_reason: null, updated_by: user.id, updated_at: new Date().toISOString() }
      : { rule_status: "Archived", archived_at: new Date().toISOString(), archived_by: user.id, archive_reason: dto.reason, updated_by: user.id, updated_at: new Date().toISOString() };
    const after = await this.db.single<Row>(this.db.from("audit_approval_rules").update(payload).eq("company_id", user.tenantId).eq("id", ruleId).select().single());
    await this.write(user, after, `Audit Review Rule ${this.titleCase(action)}`, dto.reason ?? "Rule status changed.", before, after);
    return this.rule(user, ruleId);
  }

  async historyEvents(user: RequestUser, query: Row = {}) {
    const page = Math.max(1, Number(query.page ?? 1));
    const limit = Math.min(250, Math.max(1, Number(query.limit ?? 25)));
    let request: any = this.db.from("audit_approval_history_events").select("*", { count: "exact" }).eq("company_id", user.tenantId);
    if (query.approvalId) request = request.eq("approval_id", query.approvalId);
    if (query.ruleId) request = request.eq("rule_id", query.ruleId);
    if (query.sourceModule) request = request.eq("source_module", query.sourceModule);
    const siteId = query.siteId ?? user.selectedSiteId;
    if (siteId) {
      this.assertSite(user, String(siteId));
      request = request.eq("site_id", siteId);
    } else if (user.selectedSiteId && !user.corporateView) request = request.eq("site_id", user.selectedSiteId);
    const { data, count, error } = await request.order("created_at", { ascending: false }).range((page - 1) * limit, page * limit - 1);
    if (error) throw new BadRequestException(error.message);
    const rows = (data ?? []).filter((row: Row) => this.canSeeSite(user, row.site_id));
    return { rows, total: count ?? rows.length, page, limit };
  }

  async settings(user: RequestUser, siteId?: string | null) {
    if (siteId) this.assertSite(user, siteId);
    let request: any = this.db.from("audit_approval_settings").select("*").eq("company_id", user.tenantId);
    request = siteId ? request.eq("site_id", siteId) : request.is("site_id", null);
    const row = await this.safeSingle(request.single());
    if (row) return row;
    const companyRow = await this.safeSingle(this.db.from("audit_approval_settings").select("*").eq("company_id", user.tenantId).is("site_id", null).single());
    return companyRow ?? {
      company_id: user.tenantId,
      site_id: siteId ?? null,
      require_esign_for_safety_critical: true,
      require_esign_for_regulatory_critical: true,
      prevent_self_approval: true,
      block_approval_if_stale: true,
      block_approval_if_validation_failed: true,
      auto_lock_approved_records: true,
      allow_approve_with_conditions: true,
      default_sla_days: 7,
    };
  }

  async updateSettings(user: RequestUser, dto: Row) {
    const siteId = dto.siteId ?? dto.site_id ?? null;
    if (siteId) this.assertSite(user, String(siteId));
    let request: any = this.db.from("audit_approval_settings").select("*").eq("company_id", user.tenantId);
    request = siteId ? request.eq("site_id", siteId) : request.is("site_id", null);
    const before = await this.safeSingle(request.single());
    const payload = this.withoutUndefined({
      company_id: user.tenantId,
      site_id: siteId,
      require_esign_for_safety_critical: this.bool(dto.requireEsignForSafetyCritical ?? dto.require_esign_for_safety_critical, before?.require_esign_for_safety_critical ?? true),
      require_esign_for_regulatory_critical: this.bool(dto.requireEsignForRegulatoryCritical ?? dto.require_esign_for_regulatory_critical, before?.require_esign_for_regulatory_critical ?? true),
      prevent_self_approval: this.bool(dto.preventSelfApproval ?? dto.prevent_self_approval, before?.prevent_self_approval ?? true),
      block_approval_if_stale: this.bool(dto.blockApprovalIfStale ?? dto.block_approval_if_stale, before?.block_approval_if_stale ?? true),
      block_approval_if_validation_failed: this.bool(dto.blockApprovalIfValidationFailed ?? dto.block_approval_if_validation_failed, before?.block_approval_if_validation_failed ?? true),
      auto_lock_approved_records: this.bool(dto.autoLockApprovedRecords ?? dto.auto_lock_approved_records, before?.auto_lock_approved_records ?? true),
      allow_approve_with_conditions: this.bool(dto.allowApproveWithConditions ?? dto.allow_approve_with_conditions, before?.allow_approve_with_conditions ?? true),
      default_sla_days: dto.defaultSlaDays ?? dto.default_sla_days ?? before?.default_sla_days ?? 7,
      settings_json: dto.settingsJson ?? dto.settings_json ?? before?.settings_json ?? {},
      updated_by: user.id,
      updated_at: new Date().toISOString(),
    });
    const after = before
      ? await this.db.single<Row>(this.db.from("audit_approval_settings").update(payload).eq("company_id", user.tenantId).eq("id", before.id).select().single())
      : await this.db.single<Row>(this.db.from("audit_approval_settings").insert(payload).select().single());
    await this.write(user, after, "Audit Review Settings Updated", "Review and approval settings changed.", before, after);
    return after;
  }

  async context(user: RequestUser) {
    const [sites, units, areas, users, rules] = await Promise.all([
      this.safeRows(this.db.from("Site").select("id,name,tenantId").eq("tenantId", user.tenantId).order("name")),
      this.safeRows(this.db.from("Unit").select("id,name,siteId,tenantId").eq("tenantId", user.tenantId).order("name")),
      this.safeRows(this.db.from("Area").select("id,name,siteId,unitId,tenantId").eq("tenantId", user.tenantId).order("name")),
      this.safeRows(this.db.from("User").select("id,name,email,role,department,isActive,tenantId").eq("tenantId", user.tenantId).order("name")),
      this.rules(user, { limit: 250 }),
    ]);
    return {
      sites: sites.filter((site) => this.canSeeSite(user, site.id)),
      units,
      areas,
      users: users.filter((row) => row.isActive !== false),
      rules: rules.rows,
      lookups: this.lookups(),
      permissions: user.permissions,
    };
  }

  private async runValidation(user: RequestUser, approvalId: string, dto: Row = {}) {
    const before = await this.package(user, approvalId);
    const currentSource = await this.safeSourceRow(user, this.normalizeSource(before.source_module), before.source_record_id);
    const currentHash = currentSource ? this.hash(currentSource) : before.source_snapshot_hash;
    const checks = [
      { type: "Source Access", status: currentSource ? "Passed" : "Failed", blocking: !currentSource, message: currentSource ? "Source record is accessible in current scope." : "Source record is missing or inaccessible." },
      { type: "Source Snapshot", status: before.source_snapshot_hash ? "Passed" : "Failed", blocking: !before.source_snapshot_hash, message: "Immutable source snapshot must exist." },
      { type: "Staleness", status: currentHash === before.source_snapshot_hash ? "Passed" : "Failed", blocking: currentHash !== before.source_snapshot_hash, message: currentHash === before.source_snapshot_hash ? "Source hash is current." : "Source changed after package snapshot." },
      { type: "Reviewer Route", status: "Passed", blocking: false, message: "At least one default review stage is available or can be generated." },
      { type: "E-Signature Route", status: before.safety_critical || before.regulatory_critical ? "Warning" : "Passed", blocking: false, message: before.safety_critical || before.regulatory_critical ? "E-signature is required for critical package approval." : "E-signature is not required by criticality." },
    ];
    await this.db.single(this.db.from("audit_approval_validation_results").delete().eq("company_id", user.tenantId).eq("approval_id", approvalId).select("id").limit(1));
    for (const check of checks) {
      await this.db.single(this.db.from("audit_approval_validation_results").insert({
        company_id: user.tenantId,
        site_id: before.site_id ?? null,
        approval_id: approvalId,
        validation_type: check.type,
        validation_status: check.status,
        check_name: check.type,
        check_result: check.status,
        blocking: check.blocking,
        message: check.message,
        details_json: { sourceHash: currentHash, snapshotHash: before.source_snapshot_hash },
        validated_by: user.id,
      }).select("id").single());
    }
    const failed = checks.some((check) => check.status === "Failed" && check.blocking);
    const after = await this.updatePackage(user, before, {
      validation_status: failed ? "Failed" : checks.some((check) => check.status === "Warning") ? "Warning" : "Passed",
      validation_summary_json: { checks },
      stale_status: currentHash === before.source_snapshot_hash ? before.stale_status : "Stale",
      stale_reason: currentHash === before.source_snapshot_hash ? before.stale_reason : "Source data changed after package snapshot.",
      package_status: failed ? "Validation Failed" : before.package_status,
    });
    await this.write(user, after, "Audit Approval Validation Run", dto.reason ?? "Approval validation checks executed.", before, after);
    return this.detail(user, approvalId);
  }

  private async refreshSnapshot(user: RequestUser, approvalId: string, dto: Row = {}) {
    const before = await this.package(user, approvalId);
    const source = await this.sourceRow(user, this.normalizeSource(before.source_module), before.source_record_id);
    const after = await this.updatePackage(user, before, {
      source_snapshot_json: source,
      source_snapshot_hash: this.hash(source),
      source_record_status: source[this.statusColumn(this.normalizeSource(before.source_module))] ?? before.source_record_status,
      stale_status: "Current",
      stale_reason: null,
      validation_status: "Not Run",
      package_status: before.package_status === "Stale" || before.package_status === "Validation Failed" ? "Draft" : before.package_status,
    });
    await this.write(user, after, "Audit Approval Snapshot Refreshed", dto.reason ?? "Source snapshot refreshed.", before, after);
    return this.detail(user, approvalId);
  }

  private async markStale(user: RequestUser, approvalId: string, dto: Row = {}) {
    const before = await this.package(user, approvalId);
    const after = await this.updatePackage(user, before, { stale_status: "Stale", stale_reason: dto.reason ?? "Source changed.", package_status: "Stale" });
    await this.db.single(this.db.from("audit_approval_staleness_events").insert({
      company_id: user.tenantId,
      site_id: before.site_id ?? null,
      approval_id: approvalId,
      stale_trigger_type: dto.staleTriggerType ?? "Manual",
      source_module: before.source_module,
      source_record_id: before.source_record_id,
      previous_snapshot_hash: before.source_snapshot_hash,
      current_snapshot_hash: dto.currentSnapshotHash ?? null,
      detected_by: user.id,
    }).select("id").single());
    await this.write(user, after, "Audit Approval Marked Stale", dto.reason ?? "Package marked stale.", before, after);
    return this.detail(user, approvalId);
  }

  private async archive(user: RequestUser, approvalId: string, dto: Row = {}) {
    if (!String(dto.reason ?? "").trim()) throw new BadRequestException("Archive reason is required.");
    const before = await this.package(user, approvalId);
    const after = await this.updatePackage(user, before, { package_status: "Archived", archived_at: new Date().toISOString(), archived_by: user.id, archive_reason: dto.reason });
    await this.write(user, after, "Audit Approval Package Archived", dto.reason, before, after);
    return this.detail(user, approvalId);
  }

  private async assertDecisionAllowed(user: RequestUser, approval: Row, action: string, settings: Row, dto: Row) {
    const elevated = user.isCompanyAdmin || user.isSiteAdmin || user.permissions.includes("audit.review.approve");
    const participants = await this.children(user, "audit_approval_participants", approval.id, "approval_id", "assigned_at", true);
    const assigned = participants.some((participant) => participant.reviewer_user_id === user.id);
    if (!assigned && !elevated && ["approve", "approve-with-conditions", "reject", "return", "request-info", "e-sign"].includes(action)) {
      throw new ForbiddenException("You must be an assigned reviewer or have elevated review permission.");
    }
    if (settings.prevent_self_approval !== false && approval.submitted_by === user.id && !elevated && ["approve", "approve-with-conditions"].includes(action)) {
      throw new ForbiddenException("Self-approval is blocked by audit review settings.");
    }
    if (settings.block_approval_if_stale !== false && approval.stale_status !== "Current" && ["approve", "approve-with-conditions"].includes(action)) {
      throw new BadRequestException("Stale approval package cannot be approved. Refresh the snapshot and resubmit.");
    }
    if (settings.block_approval_if_validation_failed !== false && approval.validation_status === "Failed" && ["approve", "approve-with-conditions"].includes(action)) {
      throw new BadRequestException("Validation failed package cannot be approved without configured override.");
    }
    if (action === "approve-with-conditions" && settings.allow_approve_with_conditions === false) {
      throw new BadRequestException("Approve with conditions is disabled by audit review settings.");
    }
    if (action === "approve-with-conditions" && !this.asArray(dto.conditions ?? dto.conditions_json).length) {
      throw new BadRequestException("At least one condition is required for approve with conditions.");
    }
  }

  private async createDecision(user: RequestUser, approval: Row, action: string, dto: Row) {
    const decisionName: Row = {
      approve: "Approve",
      "approve-with-conditions": "Approve With Conditions",
      reject: "Reject",
      return: "Return",
      "request-info": "Request Info",
      delegate: "Delegate",
      reassign: "Reassign",
      escalate: "Escalate",
      "e-sign": "E-Sign",
    };
    const payload = {
      company_id: user.tenantId,
      site_id: approval.site_id ?? null,
      approval_id: approval.id,
      stage_id: approval.current_stage_id ?? null,
      decision: decisionName[action] ?? action,
      reason: dto.reason ?? dto.comment ?? null,
      correction_instructions: dto.correctionInstructions ?? dto.correction_instructions ?? null,
      conditions_json: dto.conditions ?? dto.conditions_json ?? null,
      e_signature_required: action === "e-sign" || approval.safety_critical || approval.regulatory_critical || approval.psm_critical,
      e_signature_id: dto.eSignatureId ?? dto.e_signature_id ?? null,
      source_snapshot_hash: approval.source_snapshot_hash,
      decided_by: user.id,
    };
    return this.db.single<Row>(this.db.from("audit_approval_decisions").insert(payload).select().single());
  }

  private async linkEsignature(user: RequestUser, approval: Row, decision: Row, dto: Row) {
    const signatureId = dto.eSignatureId ?? dto.e_signature_id;
    if (!signatureId) throw new BadRequestException("Existing Universal E-Signature reference is required. Audit Review stores links only.");
    return this.db.single(this.db.from("audit_approval_esignature_links").insert({
      company_id: user.tenantId,
      site_id: approval.site_id ?? null,
      approval_id: approval.id,
      decision_id: decision.id,
      e_signature_id: signatureId,
      e_signature_status: dto.eSignatureStatus ?? dto.e_signature_status ?? "Signed",
      signer_user_id: user.id,
      signed_at: dto.signedAt ?? dto.signed_at ?? new Date().toISOString(),
      signature_meaning: dto.signatureMeaning ?? dto.signature_meaning ?? decision.decision,
    }).select("id").single());
  }

  private async createConditionsFromDecision(user: RequestUser, approval: Row, decision: Row, conditions: unknown) {
    for (const condition of this.asArray(conditions)) {
      await this.addCondition(user, approval.id, { ...condition, decision_id: decision.id });
    }
  }

  private async createInitialStages(user: RequestUser, approval: Row, dto: Row) {
    const requestedStages = this.asArray(dto.stages ?? dto.reviewStages ?? []);
    const stages = requestedStages.length ? requestedStages : [{ stageName: "Technical Review", reviewerUserId: dto.reviewerUserId ?? user.id, reviewerRole: "Reviewer", eSignatureRequired: approval.safety_critical || approval.regulatory_critical }];
    let order = 1;
    for (const stage of stages) {
      const stageRow = await this.db.single<Row>(this.db.from("audit_approval_stages").insert({
        company_id: user.tenantId,
        site_id: approval.site_id ?? null,
        approval_id: approval.id,
        stage_name: stage.stageName ?? stage.stage_name ?? `Stage ${order}`,
        stage_order: Number(stage.stageOrder ?? stage.stage_order ?? order),
        stage_type: stage.stageType ?? stage.stage_type ?? "Technical Review",
        stage_status: order === 1 ? "Active" : "Pending",
        parallel: this.bool(stage.parallel, false),
        minimum_approvals: Number(stage.minimumApprovals ?? stage.minimum_approvals ?? 1),
        required: this.bool(stage.required, true),
        e_signature_required: this.bool(stage.eSignatureRequired ?? stage.e_signature_required, approval.safety_critical || approval.regulatory_critical),
        due_at: stage.dueAt ?? stage.due_at ?? approval.due_at ?? null,
        started_at: order === 1 ? new Date().toISOString() : null,
      }).select().single());
      await this.db.single(this.db.from("audit_approval_participants").insert({
        company_id: user.tenantId,
        site_id: approval.site_id ?? null,
        approval_id: approval.id,
        stage_id: stageRow.id,
        reviewer_user_id: stage.reviewerUserId ?? stage.reviewer_user_id ?? dto.reviewerUserId ?? user.id,
        reviewer_name: stage.reviewerName ?? stage.reviewer_name ?? null,
        reviewer_email: stage.reviewerEmail ?? stage.reviewer_email ?? null,
        reviewer_role: stage.reviewerRole ?? stage.reviewer_role ?? "Reviewer",
        reviewer_discipline: stage.reviewerDiscipline ?? stage.reviewer_discipline ?? null,
        participant_type: stage.participantType ?? stage.participant_type ?? "Reviewer",
        participant_status: "Assigned",
        required: this.bool(stage.required, true),
        assigned_by: user.id,
        due_at: stage.dueAt ?? stage.due_at ?? approval.due_at ?? null,
      }).select("id").single());
      order += 1;
    }
  }

  private async replaceRuleStages(user: RequestUser, rule: Row, stages: unknown) {
    const rows = this.asArray(stages);
    if (!rows.length) return;
    await this.db.single(this.db.from("audit_approval_rule_stages").delete().eq("company_id", user.tenantId).eq("rule_id", rule.id).select("id").limit(1));
    let order = 1;
    for (const stage of rows) {
      await this.db.single(this.db.from("audit_approval_rule_stages").insert({
        company_id: user.tenantId,
        site_id: rule.site_id ?? null,
        rule_id: rule.id,
        stage_name: stage.stageName ?? stage.stage_name ?? `Stage ${order}`,
        stage_order: Number(stage.stageOrder ?? stage.stage_order ?? order),
        reviewer_role: stage.reviewerRole ?? stage.reviewer_role ?? null,
        reviewer_user_id: stage.reviewerUserId ?? stage.reviewer_user_id ?? null,
        required: this.bool(stage.required, true),
        parallel: this.bool(stage.parallel, false),
        minimum_approvals: Number(stage.minimumApprovals ?? stage.minimum_approvals ?? 1),
        allow_reject: this.bool(stage.allowReject ?? stage.allow_reject, true),
        allow_return: this.bool(stage.allowReturn ?? stage.allow_return, true),
        conditions_allowed: this.bool(stage.conditionsAllowed ?? stage.conditions_allowed, true),
        e_signature_required: this.bool(stage.eSignatureRequired ?? stage.e_signature_required, false),
        sla_days: stage.slaDays ?? stage.sla_days ?? null,
        escalation_owner_user_id: stage.escalationOwnerUserId ?? stage.escalation_owner_user_id ?? null,
      }).select("id").single());
      order += 1;
    }
  }

  private async package(user: RequestUser, approvalId: string) {
    const row = await this.singleById(user, "audit_approval_packages", approvalId, "Approval package not found.");
    if (!this.canSeeSite(user, row.site_id)) throw new ForbiddenException("Approval package is outside your current site scope.");
    return row;
  }

  private async singleById(user: RequestUser, table: string, id: string, message: string) {
    const row = await this.safeSingle(this.db.from(table).select("*").eq("company_id", user.tenantId).eq("id", id).single());
    if (!row) throw new NotFoundException(message);
    if (!this.canSeeSite(user, row.site_id)) throw new ForbiddenException("Record is outside your current site scope.");
    return row;
  }

  private async singleChild(user: RequestUser, table: string, approvalId: string, id: string) {
    const row = await this.safeSingle(this.db.from(table).select("*").eq("company_id", user.tenantId).eq("approval_id", approvalId).eq("id", id).single());
    if (!row) throw new NotFoundException("Approval child record not found.");
    if (!this.canSeeSite(user, row.site_id)) throw new ForbiddenException("Record is outside your current site scope.");
    return row;
  }

  private async children(user: RequestUser, table: string, id: string, column: string, order: string, ascending: boolean) {
    const rows = await this.safeRows(this.db.from(table).select("*").eq("company_id", user.tenantId).eq(column, id).order(order, { ascending }));
    return rows.filter((row) => this.canSeeSite(user, row.site_id));
  }

  private async updatePackage(user: RequestUser, before: Row, patch: Row) {
    const payload = this.withoutUndefined({ ...patch, updated_by: user.id, updated_at: new Date().toISOString() });
    return this.db.single<Row>(this.db.from("audit_approval_packages").update(payload).eq("company_id", user.tenantId).eq("id", before.id).select().single());
  }

  private async sourceRow(user: RequestUser, sourceModule: string, sourceRecordId: string) {
    const row = await this.safeSourceRow(user, sourceModule, sourceRecordId);
    if (!row) throw new NotFoundException(`Source ${this.sourceLabel(sourceModule)} record was not found or is inaccessible.`);
    return row;
  }

  private async safeSourceRow(user: RequestUser, sourceModule: string, sourceRecordId: string) {
    const config = SOURCE_CONFIG[sourceModule];
    if (!config) throw new BadRequestException(`Unsupported audit review source module: ${sourceModule}`);
    const row = await this.safeSingle(this.db.from(config.table).select("*").eq("company_id", user.tenantId).eq("id", sourceRecordId).single());
    if (!row || !this.canSeeSite(user, row.site_id)) return null;
    return row;
  }

  private async enrichPackage(user: RequestUser, row: Row): Promise<Row> {
    const [participants, decisions, conditions, validation, esignatures] = await Promise.all([
      this.children(user, "audit_approval_participants", row.id, "approval_id", "assigned_at", true),
      this.children(user, "audit_approval_decisions", row.id, "approval_id", "decided_at", false),
      this.children(user, "audit_approval_conditions", row.id, "approval_id", "created_at", true),
      this.children(user, "audit_approval_validation_results", row.id, "approval_id", "validated_at", false),
      this.children(user, "audit_approval_esignature_links", row.id, "approval_id", "created_at", false),
    ]);
    return {
      ...row,
      participant_count: participants.length,
      decision_count: decisions.length,
      condition_count: conditions.length,
      open_condition_count: conditions.filter((item) => !["Completed", "Verified", "Waived"].includes(item.condition_status)).length,
      validation_failure_count: validation.filter((item) => item.validation_status === "Failed").length,
      esignature_pending_count: esignatures.filter((item) => item.e_signature_status === "Pending").length,
      e_signature_required: Boolean(row.safety_critical || row.regulatory_critical || row.psm_critical || esignatures.length),
      overdue: this.isOverdue(row),
    };
  }

  private validationChecks(approval: Row, validationRows: Row[]) {
    if (validationRows.length) return validationRows;
    return [
      { validation_type: "Source Access", validation_status: approval.source_record_id ? "Passed" : "Failed", blocking: !approval.source_record_id, message: "Approval package must have a valid source object." },
      { validation_type: "Source Snapshot", validation_status: approval.source_snapshot_hash ? "Passed" : "Failed", blocking: !approval.source_snapshot_hash, message: "Immutable snapshot hash is required." },
      { validation_type: "Staleness", validation_status: approval.stale_status === "Current" ? "Passed" : "Failed", blocking: approval.stale_status !== "Current", message: "Stale packages must be refreshed before approval." },
    ];
  }

  private readiness(approval: Row, checks: Row[], stages: Row[], participants: Row[], conditions: Row[], settings: Row) {
    const blockers = [
      ...checks.filter((check) => check.blocking && check.validation_status === "Failed").map((check) => ({ title: check.validation_type, message: check.message, severity: "Critical" })),
      ...(approval.stale_status !== "Current" && settings.block_approval_if_stale !== false ? [{ title: "Stale package", message: approval.stale_reason ?? "Source changed after submission.", severity: "Critical" }] : []),
      ...(!stages.length ? [{ title: "Reviewer route missing", message: "At least one approval stage is required.", severity: "Critical" }] : []),
      ...(!participants.length ? [{ title: "Reviewer missing", message: "At least one reviewer participant is required.", severity: "Critical" }] : []),
      ...conditions.filter((item) => item.blocking && !["Completed", "Verified", "Waived"].includes(item.condition_status)).map((item) => ({ title: item.condition_title, message: "Blocking approval condition is open.", severity: "Warning" })),
    ];
    return {
      status: blockers.some((item) => item.severity === "Critical") ? "Blocked" : blockers.length ? "Warning" : "Ready",
      blockers,
      readyForApproval: !blockers.some((item) => item.severity === "Critical"),
      reportReady: approval.report_ready,
      lockedSource: approval.locked_source,
    };
  }

  private sourcePanel(approval: Row) {
    return {
      sourceModule: approval.source_module,
      sourceObjectType: approval.source_object_type,
      sourceRecordId: approval.source_record_id,
      sourceRecordNumber: approval.source_record_number,
      sourceRecordTitle: approval.source_record_title,
      sourceRecordStatus: approval.source_record_status,
      snapshotHash: approval.source_snapshot_hash,
      staleStatus: approval.stale_status,
      staleReason: approval.stale_reason,
      restricted: false,
    };
  }

  private summary(rows: Row[]) {
    const statuses = this.group(rows, "package_status");
    return {
      total: rows.length,
      pending: rows.filter((row) => ["Submitted", "In Review"].includes(row.package_status)).length,
      overdue: rows.filter((row) => this.isOverdue(row)).length,
      stale: rows.filter((row) => row.stale_status !== "Current").length,
      validationFailures: rows.filter((row) => row.validation_status === "Failed" || row.package_status === "Validation Failed").length,
      esignaturePending: rows.filter((row) => row.e_signature_required || row.esignature_pending_count > 0).length,
      approved: rows.filter((row) => row.package_status === "Approved").length,
      rejected: rows.filter((row) => row.package_status === "Rejected").length,
      returned: rows.filter((row) => row.package_status === "Returned").length,
      approvedWithConditions: rows.filter((row) => row.package_status === "Approved With Conditions").length,
      completed: rows.filter((row) => row.package_status === "Completed").length,
      reportReady: rows.filter((row) => row.report_ready).length,
      safetyCritical: rows.filter((row) => row.safety_critical).length,
      statuses,
    };
  }

  private group(rows: Row[], column: string) {
    const map = new Map<string, number>();
    for (const row of rows) {
      const key = String(row[column] ?? "Unspecified");
      map.set(key, (map.get(key) ?? 0) + 1);
    }
    return Array.from(map.entries()).map(([key, count]) => ({ key, label: key, count }));
  }

  private async reviewerWorkload(user: RequestUser) {
    const rows = await this.safeRows(this.db.from("audit_approval_participants").select("*").eq("company_id", user.tenantId).in("participant_status", ["Assigned", "Pending", "Overdue"]));
    return this.group(rows.filter((row) => this.canSeeSite(user, row.site_id)), "reviewer_user_id");
  }

  private cycleTime(rows: Row[]) {
    return this.group(rows.filter((row) => row.completed_at), "source_module").map((item) => ({ ...item, averageDays: item.count }));
  }

  private async nextPackageNumber(user: RequestUser, siteId?: string | null) {
    const prefix = `AUD-REV-${new Date().getFullYear()}`;
    const rows = await this.safeRows(this.db.from("audit_approval_packages").select("id").eq("company_id", user.tenantId).like("package_number", `${prefix}-%`));
    return `${prefix}-${String(rows.length + 1).padStart(6, "0")}${siteId ? "" : ""}`;
  }

  private async nextRuleCode(user: RequestUser) {
    const rows = await this.safeRows(this.db.from("audit_approval_rules").select("id").eq("company_id", user.tenantId));
    return `AUD-RULE-${String(rows.length + 1).padStart(4, "0")}`;
  }

  private dueDate(days: number) {
    const date = new Date();
    date.setDate(date.getDate() + Number(days || 7));
    return date.toISOString();
  }

  private sourceLabel(sourceModule: string) {
    const normalized = this.normalizeSource(sourceModule);
    return SOURCE_CONFIG[normalized]?.type ?? sourceModule;
  }

  private normalizeSource(sourceModule: unknown) {
    return String(sourceModule ?? "").trim().toLowerCase().replace(/_/g, "-").replace(/\s+/g, "-");
  }

  private codeColumn(sourceModule: string) {
    return SOURCE_CONFIG[sourceModule]?.code ?? "id";
  }

  private titleColumn(sourceModule: string) {
    return SOURCE_CONFIG[sourceModule]?.title ?? "id";
  }

  private statusColumn(sourceModule: string) {
    return SOURCE_CONFIG[sourceModule]?.status ?? "status";
  }

  private hash(value: unknown) {
    return createHash("sha256").update(JSON.stringify(value ?? {})).digest("hex");
  }

  private isOverdue(row: Row) {
    return Boolean(row.due_at && !["Approved", "Completed", "Rejected", "Cancelled", "Archived"].includes(row.package_status) && new Date(row.due_at).getTime() < Date.now());
  }

  private assertSite(user: RequestUser, siteId: string) {
    if (!this.canSeeSite(user, siteId)) throw new ForbiddenException("Selected site is outside your current audit scope.");
  }

  private canSeeSite(user: RequestUser, siteId?: string | null) {
    if (!siteId) return true;
    if (user.isSuperAdmin || user.corporateView || user.isCompanyAdmin) return true;
    return user.siteIds.includes(siteId) || user.selectedSiteId === siteId || user.activeSiteId === siteId;
  }

  private async safeRows(query: PromiseLike<any>) {
    const { data, error } = await query;
    if (error) return [];
    return (data ?? []) as Row[];
  }

  private async safeSingle(query: PromiseLike<any>) {
    const { data, error } = await query;
    if (error) return null;
    return data as Row | null;
  }

  private bool(value: unknown, fallback: boolean) {
    if (value === undefined || value === null || value === "") return fallback;
    if (typeof value === "boolean") return value;
    if (typeof value === "string") return ["true", "1", "yes", "on"].includes(value.toLowerCase());
    return Boolean(value);
  }

  private truthy(value: unknown) {
    return value === true || value === "true" || value === "1" || value === 1;
  }

  private asArray(value: unknown): Row[] {
    if (Array.isArray(value)) return value as Row[];
    if (value && typeof value === "object") return [value as Row];
    return [];
  }

  private withoutUndefined(row: Row) {
    return Object.fromEntries(Object.entries(row).filter(([, value]) => value !== undefined));
  }

  private titleCase(value: string) {
    return value.replace(/-/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
  }

  private write(user: RequestUser, row: Row, title: string, description: string, before: Row | null, after: Row | null) {
    return this.history.write({
      tenantId: user.tenantId,
      siteId: row.site_id ?? after?.site_id ?? before?.site_id ?? null,
      unitId: row.unit_id ?? after?.unit_id ?? before?.unit_id ?? null,
      areaId: row.area_id ?? after?.area_id ?? before?.area_id ?? null,
      approvalId: row.id ?? after?.id ?? before?.id ?? null,
      ruleId: row.rule_id ?? after?.rule_id ?? before?.rule_id ?? null,
      sourceModule: row.source_module ?? after?.source_module ?? before?.source_module ?? null,
      sourceRecordType: row.source_object_type ?? after?.source_object_type ?? before?.source_object_type ?? null,
      sourceRecordId: row.source_record_id ?? after?.source_record_id ?? before?.source_record_id ?? null,
      type: title,
      title,
      description,
      before,
      after,
      actorId: user.id,
    });
  }
}
