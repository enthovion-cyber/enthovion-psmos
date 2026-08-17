import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { RequestUser } from "../common/decorators/current-user.decorator";
import { SupabaseService } from "../database/supabase.service";
import { AuditCapaHistoryService } from "./audit-capa-history.service";
import {
  auditableModules,
  criticalityLevels,
  standardOptions,
} from "./audit-compliance.constants";

type Row = Record<string, any>;

const CAPA_LOCKED = ["Closed", "Cancelled", "Archived"];
const ACTION_DONE = ["Completed", "Verified", "Closed"];
const ACTION_REWORK = ["Rejected", "Reopened"];
const CAPA_STATUSES = [
  "Draft",
  "Open",
  "Pending Assignment",
  "In Progress",
  "Pending Evidence",
  "Pending Verification",
  "Verification Failed",
  "Completed",
  "Effectiveness Check Pending",
  "Effective",
  "Ineffective",
  "Ready For Closure",
  "Closure Pending Review",
  "Closed",
  "Reopened",
  "Cancelled",
  "Archived",
];
const ACTION_TYPES = [
  "Immediate Containment",
  "Corrective Action",
  "Preventive Action",
  "Systemic Action",
  "Verification Action",
  "Effectiveness Check",
  "Document Update",
  "Training Action",
  "MOC Action",
  "PTW Action",
  "PSSR Action",
  "PSI Update Action",
  "Mechanical Integrity Action",
  "Procedure Update Action",
  "Engineering Action",
  "Administrative Action",
  "Custom",
];
const ACTION_STATUSES = [
  "Draft",
  "Assigned",
  "Open",
  "In Progress",
  "Waiting Evidence",
  "Submitted For Verification",
  "Completed",
  "Verified",
  "Rejected",
  "Overdue",
  "Reopened",
  "Cancelled",
  "Closed",
];
const VERIFICATION_STATUSES = ["Not Required", "Required", "Pending Verification", "Verified", "Rejected", "Rework Required", "Waived Foundation"];
const EFFECTIVENESS_STATUSES = ["Not Required", "Required", "Pending", "Scheduled", "Effective", "Ineffective", "Needs Follow-Up", "Overdue", "Waived Foundation"];
const CLOSURE_STATUSES = ["Not Ready", "Missing CAPA", "Missing Actions", "Actions Incomplete", "Evidence Missing", "Verification Pending", "Effectiveness Pending", "Rework Required", "Review Pending", "Ready For Closure", "Closed"];
const CATEGORIES = ["Audit Finding CAPA", "Safety-Critical CAPA", "Regulatory CAPA", "PSM System CAPA", "Repeat Finding CAPA", "Site CAPA", "Unit CAPA", "Module CAPA", "Contractor CAPA", "Custom"];
const CAUSE_CATEGORIES = ["Procedure Gap", "Training Gap", "Competency Gap", "Supervision Gap", "Equipment / Asset Integrity Gap", "Engineering Design Gap", "Maintenance Gap", "PTW Control Gap", "MOC Control Gap", "PSSR Readiness Gap", "PSI Information Gap", "Document Control Gap", "Communication Gap", "Management System Gap", "Contractor Management Gap", "Human Factors", "Unknown / To Be Investigated", "Custom"];
const VERIFICATION_METHODS = ["Document Review", "Field Verification", "Interview Verification", "System Record Verification", "Photo Evidence Verification", "Supervisor Verification", "HSE Verification", "Process Safety Verification", "Audit Lead Verification", "Custom"];
const EFFECTIVENESS_METHODS = ["Follow-up Audit", "Field Verification", "Trend Review", "Record Review", "Re-Inspection", "Interview", "KPI Review", "Repeat Finding Check", "System Test", "Custom"];

@Injectable()
export class AuditCapaService {
  constructor(
    private readonly db: SupabaseService,
    private readonly history: AuditCapaHistoryService,
  ) {}

  lookups() {
    return {
      capaStatuses: CAPA_STATUSES,
      capaCategories: CATEGORIES,
      capaActionTypes: ACTION_TYPES,
      capaActionStatuses: ACTION_STATUSES,
      capaVerificationStatuses: VERIFICATION_STATUSES,
      capaEffectivenessStatuses: EFFECTIVENESS_STATUSES,
      capaClosureReadinessStatuses: CLOSURE_STATUSES,
      causeCategories: CAUSE_CATEGORIES,
      verificationMethods: VERIFICATION_METHODS,
      effectivenessMethods: EFFECTIVENESS_METHODS,
      priorities: ["Low", "Medium", "High", "Urgent", "Immediate"],
      criticalityLevels,
      auditableModules: auditableModules.map(([key, label]) => ({ key, label })),
      standardOptions,
    };
  }

  async context(user: RequestUser) {
    const [sites, units, areas, users, findings, programs, plans, executions, settings] = await Promise.all([
      this.safeRows(this.db.from("Site").select("id,name,tenantId").eq("tenantId", user.tenantId).order("name")),
      this.safeRows(this.db.from("Unit").select("id,name,siteId,tenantId").eq("tenantId", user.tenantId).order("name")),
      this.safeRows(this.db.from("Area").select("id,name,siteId,unitId,tenantId").eq("tenantId", user.tenantId).order("name")),
      this.safeRows(this.db.from("User").select("id,name,email,role,department,isActive,tenantId").eq("tenantId", user.tenantId).order("name")),
      this.safeRows(this.db.from("audit_findings").select("id,finding_code,finding_title,finding_status,capa_readiness_status,ready_for_capa,site_id,unit_id,area_id,program_id,plan_id,execution_id,severity,criticality,repeat_finding,safety_critical,regulatory_critical,psm_critical,source_snapshot_json").eq("company_id", user.tenantId).order("updated_at", { ascending: false })),
      this.safeRows(this.db.from("audit_programs").select("id,program_code,program_title,site_id").eq("company_id", user.tenantId).order("program_title")),
      this.safeRows(this.db.from("audit_plans").select("id,plan_code,plan_title,program_id,site_id").eq("company_id", user.tenantId).order("plan_title")),
      this.safeRows(this.db.from("audit_executions").select("id,execution_code,execution_title,program_id,plan_id,site_id,unit_id,area_id").eq("company_id", user.tenantId).order("updated_at", { ascending: false })),
      this.settings(user, user.selectedSiteId ?? null),
    ]);
    const scopedFindings = findings.filter((finding) => this.canSeeSite(user, finding.site_id));
    return {
      sites: sites.filter((site) => this.canSeeSite(user, site.id)),
      units,
      areas,
      users: users.filter((u) => u.isActive !== false),
      findings: scopedFindings,
      readyFindings: scopedFindings.filter((finding) => this.findingIsReadyForCapa(finding)),
      programs,
      plans,
      executions,
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
      byUnit: this.group(rows, "unit_id"),
      byProgram: this.group(rows, "program_id"),
      byPlan: this.group(rows, "plan_id"),
      byOwner: this.group(rows, "capa_owner_user_id"),
      byModule: this.group(rows, "primary_module"),
      bySeverity: this.group(rows, "finding_severity"),
      overdue: rows.filter((row) => row.overdue_actions > 0 || this.isOverdue(row)),
      safetyCritical: rows.filter((row) => row.criticality === "Safety-Critical" || row.safety_critical),
      regulatoryCritical: rows.filter((row) => row.criticality === "Regulatory-Critical" || row.regulatory_critical),
      repeatFindings: rows.filter((row) => row.repeat_finding),
      pendingVerification: rows.filter((row) => row.verification_status === "Pending Verification"),
      effectivenessPending: rows.filter((row) => row.effectiveness_status === "Pending" || row.effectiveness_status === "Scheduled"),
      ineffective: rows.filter((row) => row.effectiveness_status === "Ineffective"),
      readyForClosure: rows.filter((row) => row.closure_readiness_status === "Ready For Closure"),
      recent: rows.slice(0, 12),
      findingsWaitingForCapa: await this.findingsWaitingForCapa(user, query),
    };
  }

  async register(user: RequestUser, query: Row = {}) {
    const page = Math.max(1, Number(query.page ?? 1));
    const limit = Math.min(250, Math.max(1, Number(query.limit ?? 25)));
    let request: any = this.db.from("audit_capa_packages").select("*", { count: "exact" }).eq("company_id", user.tenantId);
    if (!this.truthy(query.includeArchived)) request = request.is("archived_at", null);
    const scopedSite = query.siteId ?? user.selectedSiteId;
    if (scopedSite) {
      this.assertSite(user, String(scopedSite));
      request = request.eq("site_id", scopedSite);
    } else if (user.selectedSiteId && !user.corporateView) request = request.eq("site_id", user.selectedSiteId);
    for (const [input, column] of Object.entries({
      status: "capa_status",
      capaStatus: "capa_status",
      category: "capa_category",
      criticality: "criticality",
      priority: "priority",
      programId: "program_id",
      planId: "plan_id",
      executionId: "execution_id",
      findingId: "primary_finding_id",
      unitId: "unit_id",
      areaId: "area_id",
      ownerUserId: "capa_owner_user_id",
      verifierUserId: "reviewer_user_id",
      verificationStatus: "verification_status",
      effectivenessStatus: "effectiveness_status",
      closureReadinessStatus: "closure_readiness_status",
    })) {
      if (query[input]) request = request.eq(column, query[input]);
    }
    if (query.search) {
      const search = String(query.search).replace(/[,%()]/g, " ").trim();
      if (search) request = request.or(`capa_code.ilike.%${search}%,capa_title.ilike.%${search}%,capa_description.ilike.%${search}%`);
    }
    const sort = String(query.sort ?? "updated_at.desc");
    const [sortColumn, direction] = sort.split(".");
    const { data, count, error } = await request.order(sortColumn || "updated_at", { ascending: direction === "asc" }).range((page - 1) * limit, page * limit - 1);
    if (error) throw new BadRequestException(error.message);
    const enriched = await this.enrichRows(user, data ?? []);
    const filtered = this.applyViewFilter(enriched, query);
    return { rows: filtered, total: count ?? filtered.length, page, limit, summary: this.summary(filtered) };
  }

  async detail(user: RequestUser, capaId: string) {
    const capa = await this.capa(user, capaId);
    const [findings, actions, containment, evidence, verification, effectiveness, readiness, syncEvents, transitions, history] = await Promise.all([
      this.childRows("audit_capa_finding_links", capa),
      this.childRows("audit_capa_actions", capa),
      this.childRows("audit_capa_containment_records", capa),
      this.childRows("audit_capa_action_evidence_links", capa),
      this.childRows("audit_capa_verification_records", capa),
      this.childRows("audit_capa_effectiveness_checks", capa),
      this.childRows("audit_capa_closure_readiness_checks", capa, "checked_at"),
      this.childRows("audit_capa_action_sync_events", capa, "created_at"),
      this.childRows("audit_capa_status_transitions", capa, "created_at"),
      this.childRows("audit_capa_history_events", capa, "created_at"),
    ]);
    return {
      capa,
      findings,
      actions,
      containment,
      evidence,
      verification,
      effectiveness,
      readiness,
      syncEvents,
      transitions,
      history,
      calculated: this.calculate(capa, actions, containment, evidence, verification, effectiveness),
    };
  }

  async create(user: RequestUser, dto: Row) {
    if (!dto.capaTitle) throw new BadRequestException("CAPA title is required.");
    const scoped = await this.resolveScope(user, dto);
    const primaryFinding = dto.primaryFindingId ? await this.finding(user, dto.primaryFindingId) : null;
    if (primaryFinding) this.validateFindingForCapa(primaryFinding, Boolean(dto.overrideFindingStatus));
    const code = dto.capaCode ?? await this.nextCode(user, scoped.site_id);
    const payload = this.capaPayload(user, dto, scoped, code, primaryFinding);
    const capa = await this.db.single<Row>(this.db.from("audit_capa_packages").insert(payload).select().single());
    if (primaryFinding) await this.linkFinding(user, capa, primaryFinding, { primaryFinding: true, groupingReason: dto.groupingReason });
    await this.applyInitialRows(user, capa, dto, primaryFinding);
    await this.recalculate(user, capa.id);
    await this.event(user, capa, "CAPA Created", "Audit CAPA package created", null, capa);
    return this.detail(user, capa.id);
  }

  async createFromFinding(user: RequestUser, findingId: string, dto: Row = {}) {
    const finding = await this.finding(user, findingId);
    this.validateFindingForCapa(finding, Boolean(dto.overrideFindingStatus));
    return this.create(user, {
      ...dto,
      primaryFindingId: finding.id,
      siteId: finding.site_id,
      unitId: finding.unit_id,
      areaId: finding.area_id,
      equipmentId: finding.equipment_id,
      programId: finding.program_id,
      planId: finding.plan_id,
      executionId: finding.execution_id,
      capaTitle: dto.capaTitle ?? `CAPA for ${finding.finding_code} - ${finding.finding_title}`,
      capaDescription: dto.capaDescription ?? finding.finding_description,
      capaCategory: dto.capaCategory ?? this.categoryFromFinding(finding),
      criticality: dto.criticality ?? finding.criticality ?? "Medium",
      priority: dto.priority ?? finding.priority ?? "Medium",
      suspectedCause: dto.suspectedCause ?? finding.classification_rationale ?? null,
      capaOwnerUserId: dto.capaOwnerUserId ?? finding.owner_user_id ?? null,
      reviewerUserId: dto.reviewerUserId ?? finding.reviewer_user_id ?? null,
      overallDueDate: dto.overallDueDate ?? finding.due_date ?? null,
      sourceSnapshot: { finding },
      correctiveActions: dto.correctiveActions ?? (finding.suggested_corrective_action ? [{ actionTitle: finding.suggested_corrective_action, actionType: "Corrective Action", ownerUserId: finding.owner_user_id, dueDate: finding.due_date, priority: finding.priority ?? "Medium", evidenceRequired: true, verificationRequired: finding.verification_required_foundation }] : []),
      preventiveActions: dto.preventiveActions ?? (finding.suggested_preventive_action ? [{ actionTitle: finding.suggested_preventive_action, actionType: "Preventive Action", ownerUserId: finding.owner_user_id, dueDate: finding.due_date, priority: finding.priority ?? "Medium", evidenceRequired: true, verificationRequired: finding.verification_required_foundation, effectivenessRequired: finding.effectiveness_check_required_foundation || finding.repeat_finding }] : []),
      containment: dto.containment ?? (finding.immediate_containment_needed ? { containmentRequired: true, containmentDescription: "Immediate containment required from finding readiness.", containmentOwnerUserId: finding.owner_user_id, containmentDueDate: finding.due_date, evidenceRequired: true } : null),
      effectiveness: dto.effectiveness ?? ((finding.effectiveness_check_required_foundation || finding.repeat_finding) ? { effectivenessRequired: true, effectivenessStatus: "Required", effectivenessOwnerUserId: finding.owner_user_id, effectivenessMethod: "Repeat Finding Check" } : null),
    });
  }

  async update(user: RequestUser, capaId: string, dto: Row) {
    const before = await this.capa(user, capaId);
    this.assertEditable(before);
    const scoped = await this.resolveScope(user, { ...before, ...dto });
    const after = await this.db.single<Row>(this.db.from("audit_capa_packages").update(this.capaPatch(user, dto, scoped)).eq("company_id", user.tenantId).eq("id", capaId).select().single());
    await this.recalculate(user, capaId);
    await this.event(user, after, "CAPA Updated", "Audit CAPA package updated", before, after);
    return this.detail(user, capaId);
  }

  async transition(user: RequestUser, capaId: string, action: string, dto: Row = {}) {
    const before = await this.capa(user, capaId);
    const detail = await this.detail(user, capaId);
    const calc = this.calculate(before, detail.actions, detail.containment, detail.evidence, detail.verification, detail.effectiveness);
    const now = new Date().toISOString();
    const patch: Row = { updated_by: user.id, updated_at: now };
    let title = "CAPA Updated";
    if (action === "open") {
      const blockers = this.validateOpen(before, detail.actions);
      if (blockers.length) throw new BadRequestException(blockers.join(" "));
      patch.capa_status = "Open";
      patch.opened_by = user.id;
      patch.opened_at = now;
      title = "CAPA Opened";
    } else if (action === "close") {
      if (!dto.closureNote) throw new BadRequestException("Close CAPA requires closure note.");
      if (calc.closureReadinessStatus !== "Ready For Closure") throw new BadRequestException(`CAPA is not ready for closure: ${calc.missingItems.join("; ")}`);
      patch.capa_status = "Closed";
      patch.closure_readiness_status = "Closed";
      patch.closed_by = user.id;
      patch.closed_at = now;
      patch.closure_note = dto.closureNote;
      title = "CAPA Closed";
    } else if (action === "reopen") {
      if (!dto.reason) throw new BadRequestException("Reopen requires reason.");
      patch.capa_status = "Reopened";
      patch.reopened_by = user.id;
      patch.reopened_at = now;
      patch.reopen_reason = dto.reason;
      title = "CAPA Reopened";
    } else if (action === "archive") {
      if (!dto.reason) throw new BadRequestException("Archive requires reason.");
      patch.capa_status = "Archived";
      patch.archived_by = user.id;
      patch.archived_at = now;
      patch.archive_reason = dto.reason;
      title = "CAPA Archived";
    } else {
      throw new BadRequestException("Unsupported CAPA transition.");
    }
    const after = await this.db.single<Row>(this.db.from("audit_capa_packages").update(patch).eq("company_id", user.tenantId).eq("id", capaId).select().single());
    await this.db.single(this.db.from("audit_capa_status_transitions").insert({ company_id: user.tenantId, site_id: before.site_id, capa_id: capaId, from_status: before.capa_status, to_status: patch.capa_status, transition_reason: dto.reason ?? dto.closureNote ?? null, transitioned_by: user.id, validation_result_json: calc }).select("id").single());
    await this.event(user, after, title, title, before, after);
    return this.detail(user, capaId);
  }

  async rows(user: RequestUser, capaId: string, section: string) {
    const capa = await this.capa(user, capaId);
    if (section === "findings") return this.childRows("audit_capa_finding_links", capa);
    if (section === "actions") return this.childRows("audit_capa_actions", capa);
    if (section === "containment") return this.childRows("audit_capa_containment_records", capa);
    if (section === "evidence") return this.childRows("audit_capa_action_evidence_links", capa);
    if (section === "verification") return this.childRows("audit_capa_verification_records", capa);
    if (section === "effectiveness") return this.childRows("audit_capa_effectiveness_checks", capa);
    if (section === "closure-readiness") return this.runClosureReadiness(user, capaId);
    if (section === "history") return this.childRows("audit_capa_history_events", capa, "created_at");
    throw new BadRequestException("Unsupported CAPA section.");
  }

  async addRow(user: RequestUser, capaId: string, section: string, dto: Row) {
    const capa = await this.capa(user, capaId);
    this.assertEditable(capa);
    let result: Row;
    if (section === "findings") {
      const finding = await this.finding(user, dto.findingId);
      result = await this.linkFinding(user, capa, finding, dto);
    } else if (section === "actions") {
      result = await this.createAction(user, capa, dto);
    } else if (section === "containment") {
      result = await this.db.single<Row>(this.db.from("audit_capa_containment_records").insert(this.containmentPayload(user, capa, dto)).select().single());
    } else if (section === "evidence") {
      result = await this.db.single<Row>(this.db.from("audit_capa_action_evidence_links").insert(this.evidencePayload(user, capa, dto)).select().single());
    } else if (section === "verification") {
      result = await this.db.single<Row>(this.db.from("audit_capa_verification_records").insert(this.verificationPayload(user, capa, dto)).select().single());
    } else if (section === "effectiveness") {
      result = await this.db.single<Row>(this.db.from("audit_capa_effectiveness_checks").insert(this.effectivenessPayload(user, capa, dto)).select().single());
    } else {
      throw new BadRequestException("Unsupported CAPA section.");
    }
    await this.recalculate(user, capaId);
    await this.event(user, capa, `CAPA ${this.title(section)} Added`, `CAPA ${section} record added`, null, result);
    return this.detail(user, capaId);
  }

  async patchRow(user: RequestUser, capaId: string, section: string, rowId: string, dto: Row) {
    const capa = await this.capa(user, capaId);
    this.assertEditable(capa);
    const table = this.sectionTable(section);
    const before = await this.safeSingle(this.db.from(table).select("*").eq("company_id", user.tenantId).eq("capa_id", capaId).eq("id", rowId).maybeSingle());
    if (!before) throw new NotFoundException("CAPA section record not found.");
    const payload = this.sectionPatch(user, capa, section, dto);
    const after = await this.db.single<Row>(this.db.from(table).update(payload).eq("company_id", user.tenantId).eq("capa_id", capaId).eq("id", rowId).select().single());
    await this.recalculate(user, capaId);
    await this.event(user, capa, `CAPA ${this.title(section)} Updated`, `CAPA ${section} record updated`, before, after);
    return this.detail(user, capaId);
  }

  async removeRow(user: RequestUser, capaId: string, section: string, rowId: string, dto: Row = {}) {
    const capa = await this.capa(user, capaId);
    this.assertEditable(capa);
    if (!dto.reason && ["findings", "actions"].includes(section)) throw new BadRequestException("Remove/cancel requires reason.");
    const table = this.sectionTable(section);
    const before = await this.safeSingle(this.db.from(table).select("*").eq("company_id", user.tenantId).eq("capa_id", capaId).eq("id", rowId).maybeSingle());
    if (!before) throw new NotFoundException("CAPA section record not found.");
    if (section === "findings") {
      await this.db.single(this.db.from(table).update({ removed_by: user.id, removed_at: new Date().toISOString(), remove_reason: dto.reason }).eq("company_id", user.tenantId).eq("id", rowId).select("id").single());
    } else if (section === "actions") {
      await this.db.single(this.db.from(table).update({ action_status: "Cancelled", cancelled_by: user.id, cancelled_at: new Date().toISOString(), cancel_reason: dto.reason, updated_by: user.id, updated_at: new Date().toISOString() }).eq("company_id", user.tenantId).eq("id", rowId).select("id").single());
    } else {
      await this.db.single(this.db.from(table).delete().eq("company_id", user.tenantId).eq("id", rowId).select("id").single());
    }
    await this.recalculate(user, capaId);
    await this.event(user, capa, `CAPA ${this.title(section)} Removed`, `CAPA ${section} record removed/cancelled`, before, null);
    return this.detail(user, capaId);
  }

  async actionLifecycle(user: RequestUser, capaId: string, actionId: string, lifecycle: string, dto: Row = {}) {
    const capa = await this.capa(user, capaId);
    this.assertEditable(capa);
    const before = await this.action(user, capaId, actionId);
    const patch: Row = { updated_by: user.id, updated_at: new Date().toISOString() };
    let title = "CAPA Action Updated";
    if (lifecycle === "assign") {
      if (!dto.ownerUserId) throw new BadRequestException("Assign action requires owner.");
      patch.owner_user_id = dto.ownerUserId;
      patch.due_date = dto.dueDate ?? before.due_date ?? null;
      patch.action_status = "Assigned";
      title = "CAPA Action Assigned";
    } else if (lifecycle === "complete") {
      if (before.evidence_required) {
        const evidence = await this.safeRows(this.db.from("audit_capa_action_evidence_links").select("id").eq("company_id", user.tenantId).eq("capa_action_id", actionId).is("removed_at", null));
        if (!evidence.length && !dto.evidenceOverrideReason) throw new BadRequestException("Completion requires evidence because this action requires evidence.");
      }
      patch.action_status = before.verification_required ? "Submitted For Verification" : "Completed";
      patch.completed_by = user.id;
      patch.completed_at = new Date().toISOString();
      patch.completion_summary = dto.completionSummary ?? null;
      title = "CAPA Action Completed";
    } else if (lifecycle === "verify") {
      this.validateVerifier(user, before, await this.settings(user, capa.site_id ?? null));
      patch.action_status = "Verified";
      title = "CAPA Action Verified";
      await this.writeVerificationDecision(user, capa, before, "Verified", dto);
    } else if (lifecycle === "reject") {
      if (!dto.reason) throw new BadRequestException("Reject verification requires reason.");
      patch.action_status = "Rejected";
      title = "CAPA Action Verification Rejected";
      await this.writeVerificationDecision(user, capa, before, "Rejected", dto);
    } else if (lifecycle === "reopen") {
      if (!dto.reason) throw new BadRequestException("Reopen action requires reason.");
      patch.action_status = "Reopened";
      title = "CAPA Action Reopened";
    } else if (lifecycle === "cancel") {
      if (!dto.reason) throw new BadRequestException("Cancel action requires reason.");
      patch.action_status = "Cancelled";
      patch.cancelled_by = user.id;
      patch.cancelled_at = new Date().toISOString();
      patch.cancel_reason = dto.reason;
      title = "CAPA Action Cancelled";
    } else {
      throw new BadRequestException("Unsupported CAPA action lifecycle.");
    }
    const after = await this.db.single<Row>(this.db.from("audit_capa_actions").update(patch).eq("company_id", user.tenantId).eq("capa_id", capaId).eq("id", actionId).select().single());
    await this.writeSync(user, capa, after, lifecycle, "Synced Foundation", before, after);
    await this.recalculate(user, capaId);
    await this.event(user, capa, title, title, before, after);
    return this.detail(user, capaId);
  }

  async containmentLifecycle(user: RequestUser, capaId: string, containmentId: string, lifecycle: string, dto: Row = {}) {
    const capa = await this.capa(user, capaId);
    this.assertEditable(capa);
    const before = await this.safeSingle(this.db.from("audit_capa_containment_records").select("*").eq("company_id", user.tenantId).eq("capa_id", capaId).eq("id", containmentId).maybeSingle());
    if (!before) throw new NotFoundException("Containment record not found.");
    const patch: Row = { updated_at: new Date().toISOString() };
    if (lifecycle === "complete") {
      patch.containment_status = "Completed";
      patch.completed_by = user.id;
      patch.completed_at = new Date().toISOString();
      patch.completion_note = dto.completionNote ?? null;
    } else if (lifecycle === "verify") {
      patch.containment_status = "Verified";
      patch.verified_by = user.id;
      patch.verified_at = new Date().toISOString();
      patch.verification_note = dto.verificationNote ?? null;
    } else {
      throw new BadRequestException("Unsupported containment lifecycle.");
    }
    const after = await this.db.single<Row>(this.db.from("audit_capa_containment_records").update(patch).eq("company_id", user.tenantId).eq("id", containmentId).select().single());
    await this.recalculate(user, capaId);
    await this.event(user, capa, `CAPA Containment ${this.title(lifecycle)}`, `Containment ${lifecycle}`, before, after);
    return this.detail(user, capaId);
  }

  async recordEffectivenessResult(user: RequestUser, capaId: string, effectivenessId: string, dto: Row = {}) {
    if (!dto.effectivenessResult || !dto.effectivenessComment) throw new BadRequestException("Effectiveness result and comment are required.");
    const capa = await this.capa(user, capaId);
    this.assertEditable(capa);
    const before = await this.safeSingle(this.db.from("audit_capa_effectiveness_checks").select("*").eq("company_id", user.tenantId).eq("capa_id", capaId).eq("id", effectivenessId).maybeSingle());
    if (!before) throw new NotFoundException("Effectiveness check not found.");
    const after = await this.db.single<Row>(this.db.from("audit_capa_effectiveness_checks").update({ effectiveness_status: dto.effectivenessResult === "Effective" ? "Effective" : "Ineffective", effectiveness_result: dto.effectivenessResult, effectiveness_comment: dto.effectivenessComment, checked_by: user.id, checked_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq("company_id", user.tenantId).eq("id", effectivenessId).select().single());
    await this.recalculate(user, capaId);
    await this.event(user, capa, "CAPA Effectiveness Recorded", "Effectiveness check result recorded", before, after);
    return this.detail(user, capaId);
  }

  async runClosureReadiness(user: RequestUser, capaId: string) {
    const detail = await this.detail(user, capaId);
    const calc = this.calculate(detail.capa, detail.actions, detail.containment, detail.evidence, detail.verification, detail.effectiveness);
    const row = await this.db.single<Row>(this.db.from("audit_capa_closure_readiness_checks").insert({
      company_id: user.tenantId,
      site_id: detail.capa.site_id,
      capa_id: capaId,
      finding_id: detail.capa.primary_finding_id,
      readiness_status: calc.closureReadinessStatus,
      finding_confirmed: calc.checks.findingConfirmed,
      capa_exists: true,
      corrective_actions_created: calc.checks.correctiveActionsCreated,
      preventive_actions_created: calc.checks.preventiveActionsCreated,
      containment_complete: calc.checks.containmentComplete,
      required_actions_complete: calc.checks.requiredActionsComplete,
      required_evidence_attached: calc.checks.requiredEvidenceAttached,
      verification_complete: calc.checks.verificationComplete,
      effectiveness_complete: calc.checks.effectivenessComplete,
      no_rejected_or_reopened_actions: calc.checks.noRejectedOrReopenedActions,
      no_overdue_required_actions: calc.checks.noOverdueRequiredActions,
      review_complete: calc.checks.reviewComplete,
      missing_items_json: calc.missingItems,
      warnings_json: calc.warnings,
      checked_by: user.id,
    }).select().single());
    await this.recalculate(user, capaId);
    await this.event(user, detail.capa, "CAPA Closure Readiness Calculated", `Closure readiness: ${calc.closureReadinessStatus}`, null, row);
    return row;
  }

  async findingCapa(user: RequestUser, findingId: string) {
    const finding = await this.finding(user, findingId);
    const rows = await this.safeRows(this.db.from("audit_capa_finding_links").select("*, audit_capa_packages(*)").eq("company_id", user.tenantId).eq("finding_id", finding.id).is("removed_at", null).order("linked_at", { ascending: false }));
    return { finding, rows };
  }

  async findingActions(user: RequestUser, findingId: string) {
    const finding = await this.finding(user, findingId);
    const rows = await this.safeRows(this.db.from("audit_capa_actions").select("*").eq("company_id", user.tenantId).eq("finding_id", finding.id).order("updated_at", { ascending: false }));
    return { finding, rows };
  }

  async findingClosureReadiness(user: RequestUser, findingId: string) {
    const finding = await this.finding(user, findingId);
    const linked = await this.safeRows(this.db.from("audit_capa_finding_links").select("capa_id").eq("company_id", user.tenantId).eq("finding_id", finding.id).is("removed_at", null));
    if (!linked.length) {
      return { readinessStatus: this.findingIsReadyForCapa(finding) ? "Missing CAPA" : "Not Ready", missingItems: ["CAPA package is missing."], warnings: [], finding };
    }
    const results = await Promise.all(linked.map((row) => this.detail(user, row.capa_id)));
    const blockers = results.flatMap((detail) => detail.calculated.missingItems.map((item: string) => `${detail.capa.capa_code}: ${item}`));
    const ready = blockers.length === 0 && results.some((detail) => detail.calculated.closureReadinessStatus === "Ready For Closure");
    if (ready) await this.safeSingle(this.db.from("audit_findings").update({ finding_status: "Closure Pending Foundation", updated_by: user.id, updated_at: new Date().toISOString() }).eq("company_id", user.tenantId).eq("id", finding.id).select("id").single());
    return { readinessStatus: ready ? "Ready For Closure" : "Not Ready", missingItems: blockers, warnings: [], finding, capas: results.map((detail) => detail.capa) };
  }

  async settings(user: RequestUser, siteId: string | null) {
    if (siteId) this.assertSite(user, siteId);
    const site = siteId ? await this.safeSingle(this.db.from("audit_capa_settings").select("*").eq("company_id", user.tenantId).eq("site_id", siteId).maybeSingle()) : null;
    const company = await this.safeSingle(this.db.from("audit_capa_settings").select("*").eq("company_id", user.tenantId).is("site_id", null).maybeSingle());
    return site ?? company ?? {
      company_id: user.tenantId,
      site_id: siteId,
      require_capa_for_confirmed_findings: true,
      require_capa_for_safety_critical: true,
      require_capa_for_regulatory_critical: true,
      require_capa_for_repeat_findings: true,
      require_containment_decision_for_safety_critical: true,
      require_corrective_action_for_non_conformance: true,
      require_preventive_action_for_repeat_findings: true,
      require_verification_for_safety_critical_actions: true,
      require_effectiveness_for_safety_critical_capa: true,
      require_effectiveness_for_repeat_findings: true,
      allow_finding_closure_without_capa: false,
      allow_action_owner_self_verification: false,
      auto_create_actions_in_action_engine: true,
      auto_sync_action_status: true,
      auto_mark_overdue: true,
      auto_notify_action_owner: true,
      auto_notify_verifier: true,
      auto_notify_overdue_to_escalation_owner: true,
    };
  }

  async updateSettings(user: RequestUser, dto: Row) {
    const siteId = dto.siteId ?? null;
    if (siteId) this.assertSite(user, siteId);
    const existing = siteId
      ? await this.safeSingle(this.db.from("audit_capa_settings").select("id").eq("company_id", user.tenantId).eq("site_id", siteId).maybeSingle())
      : await this.safeSingle(this.db.from("audit_capa_settings").select("id").eq("company_id", user.tenantId).is("site_id", null).maybeSingle());
    const payload = { ...this.settingsPatch(dto), company_id: user.tenantId, site_id: siteId, updated_by: user.id, updated_at: new Date().toISOString() };
    const row = existing
      ? await this.db.single<Row>(this.db.from("audit_capa_settings").update(payload).eq("company_id", user.tenantId).eq("id", existing.id).select().single())
      : await this.db.single<Row>(this.db.from("audit_capa_settings").insert(payload).select().single());
    await this.history.write({
      tenantId: user.tenantId,
      siteId: row.site_id,
      actorId: user.id,
      type: "CAPA Settings Updated",
      title: "CAPA Settings Updated",
      description: "Audit CAPA settings updated",
      before: existing,
      after: row,
    });
    return row;
  }

  async sourceScopedRegister(user: RequestUser, scope: string, id: string, query: Row = {}) {
    const map: Record<string, string> = {
      execution: "executionId",
      plan: "planId",
      program: "programId",
      site: "siteId",
      unit: "unitId",
      area: "areaId",
    };
    const key = map[scope];
    if (!key) throw new BadRequestException("Unsupported CAPA source scope.");
    return this.register(user, { ...query, [key]: id });
  }

  async globalHistory(user: RequestUser, query: Row = {}) {
    let request: any = this.db.from("audit_capa_history_events").select("*", { count: "exact" }).eq("company_id", user.tenantId);
    if (query.siteId ?? user.selectedSiteId) request = request.eq("site_id", query.siteId ?? user.selectedSiteId);
    const { data, count, error } = await request.order("created_at", { ascending: false }).range(0, Math.min(500, Number(query.limit ?? 100)) - 1);
    if (error) throw new BadRequestException(error.message);
    return { rows: data ?? [], total: count ?? 0 };
  }

  private async recalculate(user: RequestUser, capaId: string) {
    const detail = await this.detail(user, capaId);
    const calc = this.calculate(detail.capa, detail.actions, detail.containment, detail.evidence, detail.verification, detail.effectiveness);
    const patch: Row = {
      capa_status: detail.capa.capa_status === "Closed" ? "Closed" : calc.capaStatus,
      closure_readiness_status: detail.capa.capa_status === "Closed" ? "Closed" : calc.closureReadinessStatus,
      verification_status: calc.verificationStatus,
      effectiveness_status: calc.effectivenessStatus,
      updated_at: new Date().toISOString(),
      updated_by: user.id,
    };
    const row = await this.db.single<Row>(this.db.from("audit_capa_packages").update(patch).eq("company_id", user.tenantId).eq("id", capaId).select().single());
    if (row.primary_finding_id && row.closure_readiness_status === "Ready For Closure") {
      await this.safeSingle(this.db.from("audit_findings").update({ finding_status: "Closure Pending Foundation", capa_readiness_status: "CAPA Created Foundation", updated_by: user.id, updated_at: new Date().toISOString() }).eq("company_id", user.tenantId).eq("id", row.primary_finding_id).select("id").single());
    }
    return row;
  }

  private calculate(capa: Row, actions: Row[], containment: Row[], evidence: Row[], verification: Row[], effectiveness: Row[]) {
    const activeActions = actions.filter((action) => action.action_status !== "Cancelled");
    const corrective = activeActions.filter((action) => action.action_type === "Corrective Action");
    const preventive = activeActions.filter((action) => action.action_type === "Preventive Action" || action.action_type === "Systemic Action");
    const evidenceByAction = new Map<string, number>();
    evidence.filter((row) => !row.removed_at).forEach((row) => {
      if (row.capa_action_id) evidenceByAction.set(row.capa_action_id, (evidenceByAction.get(row.capa_action_id) ?? 0) + 1);
    });
    const missingEvidence = activeActions.filter((action) => action.evidence_required && !evidenceByAction.get(action.id));
    const incomplete = activeActions.filter((action) => !ACTION_DONE.includes(action.action_status));
    const verificationPending = activeActions.filter((action) => action.verification_required && action.action_status !== "Verified");
    const rework = activeActions.filter((action) => ACTION_REWORK.includes(action.action_status));
    const overdue = activeActions.filter((action) => this.isOverdue(action));
    const containmentRequired = containment.some((row) => row.containment_required);
    const containmentComplete = !containmentRequired || containment.every((row) => !row.containment_required || ["Completed", "Verified"].includes(row.containment_status));
    const effectivenessRequired = effectiveness.some((row) => row.effectiveness_required) || activeActions.some((action) => action.effectiveness_required);
    const effectivenessComplete = !effectivenessRequired || effectiveness.some((row) => row.effectiveness_status === "Effective");
    const ineffective = effectiveness.some((row) => row.effectiveness_status === "Ineffective");
    const missingItems: string[] = [];
    if (!capa.primary_finding_id) missingItems.push("Primary finding is missing.");
    if (!corrective.length) missingItems.push("Corrective action is missing.");
    if ((capa.criticality === "Safety-Critical" || capa.criticality === "Regulatory-Critical") && !preventive.length) missingItems.push("Preventive/systemic action is missing for critical CAPA.");
    if (!capa.capa_owner_user_id) missingItems.push("CAPA owner is missing.");
    if (incomplete.length) missingItems.push("Required actions are incomplete.");
    if (missingEvidence.length) missingItems.push("Required evidence is missing.");
    if (verificationPending.length) missingItems.push("Verification is pending.");
    if (!containmentComplete) missingItems.push("Immediate containment is incomplete.");
    if (effectivenessRequired && !effectivenessComplete) missingItems.push("Effectiveness check is pending.");
    if (ineffective) missingItems.push("Effectiveness check is ineffective.");
    if (rework.length) missingItems.push("Rejected or reopened action requires rework.");
    if (overdue.length) missingItems.push("Required action is overdue.");
    let closureReadinessStatus = "Ready For Closure";
    if (missingItems.includes("Primary finding is missing.")) closureReadinessStatus = "Missing CAPA";
    else if (!corrective.length) closureReadinessStatus = "Missing Actions";
    else if (incomplete.length) closureReadinessStatus = "Actions Incomplete";
    else if (missingEvidence.length) closureReadinessStatus = "Evidence Missing";
    else if (verificationPending.length) closureReadinessStatus = "Verification Pending";
    else if (effectivenessRequired && !effectivenessComplete) closureReadinessStatus = "Effectiveness Pending";
    else if (ineffective || rework.length) closureReadinessStatus = "Rework Required";
    else if (missingItems.length) closureReadinessStatus = "Not Ready";
    const verificationStatus = !activeActions.some((action) => action.verification_required) ? "Not Required" : verificationPending.length ? "Pending Verification" : rework.length ? "Rejected" : "Verified";
    const effectivenessStatus = !effectivenessRequired ? "Not Required" : ineffective ? "Ineffective" : effectivenessComplete ? "Effective" : "Pending";
    let capaStatus = capa.capa_status;
    if (["Closed", "Cancelled", "Archived"].includes(capa.capa_status)) capaStatus = capa.capa_status;
    else if (!activeActions.length) capaStatus = "Draft";
    else if (missingEvidence.length) capaStatus = "Pending Evidence";
    else if (verificationPending.length) capaStatus = "Pending Verification";
    else if (rework.length) capaStatus = "Verification Failed";
    else if (effectivenessRequired && !effectivenessComplete) capaStatus = "Effectiveness Check Pending";
    else if (closureReadinessStatus === "Ready For Closure") capaStatus = "Ready For Closure";
    else if (incomplete.length) capaStatus = "In Progress";
    else capaStatus = "Completed";
    return {
      capaStatus,
      verificationStatus,
      effectivenessStatus,
      closureReadinessStatus,
      missingItems,
      warnings: overdue.map((action) => `${action.action_title} is overdue.`),
      counts: {
        corrective: corrective.length,
        preventive: preventive.length,
        containment: containment.length,
        openActions: incomplete.length,
        overdueActions: overdue.length,
        missingEvidence: missingEvidence.length,
      },
      checks: {
        findingConfirmed: Boolean(capa.primary_finding_id),
        correctiveActionsCreated: corrective.length > 0,
        preventiveActionsCreated: preventive.length > 0,
        containmentComplete,
        requiredActionsComplete: incomplete.length === 0 && activeActions.length > 0,
        requiredEvidenceAttached: missingEvidence.length === 0,
        verificationComplete: verificationPending.length === 0,
        effectivenessComplete,
        noRejectedOrReopenedActions: rework.length === 0,
        noOverdueRequiredActions: overdue.length === 0,
        reviewComplete: capa.capa_status !== "Closure Pending Review",
      },
      verification,
    };
  }

  private async enrichRows(user: RequestUser, rows: Row[]) {
    return Promise.all(rows.map(async (row) => {
      const [actions, containment, evidence, verification, effectiveness, finding] = await Promise.all([
        this.childRows("audit_capa_actions", row),
        this.childRows("audit_capa_containment_records", row),
        this.childRows("audit_capa_action_evidence_links", row),
        this.childRows("audit_capa_verification_records", row),
        this.childRows("audit_capa_effectiveness_checks", row),
        row.primary_finding_id ? this.safeSingle(this.db.from("audit_findings").select("id,finding_code,finding_title,severity,criticality,safety_critical,regulatory_critical,psm_critical,repeat_finding").eq("company_id", user.tenantId).eq("id", row.primary_finding_id).maybeSingle()) : null,
      ]);
      const calc = this.calculate(row, actions, containment, evidence, verification, effectiveness);
      return {
        ...row,
        source_finding: finding,
        finding_code: finding?.finding_code ?? null,
        finding_title: finding?.finding_title ?? null,
        finding_severity: finding?.severity ?? null,
        safety_critical: finding?.safety_critical ?? row.criticality === "Safety-Critical",
        regulatory_critical: finding?.regulatory_critical ?? row.criticality === "Regulatory-Critical",
        repeat_finding: finding?.repeat_finding ?? row.capa_category === "Repeat Finding CAPA",
        corrective_actions: calc.counts.corrective,
        preventive_actions: calc.counts.preventive,
        containment_actions: calc.counts.containment,
        open_actions: calc.counts.openActions,
        overdue_actions: calc.counts.overdueActions,
        actions_missing_evidence: calc.counts.missingEvidence,
        calculated_status: calc.capaStatus,
        calculated_closure_readiness_status: calc.closureReadinessStatus,
      };
    }));
  }

  private applyViewFilter(rows: Row[], query: Row) {
    if (this.truthy(query.overdue)) return rows.filter((row) => row.overdue_actions > 0 || this.isOverdue(row));
    if (this.truthy(query.safetyCritical)) return rows.filter((row) => row.safety_critical);
    if (this.truthy(query.regulatoryCritical)) return rows.filter((row) => row.regulatory_critical);
    if (this.truthy(query.repeatFindings) || this.truthy(query.repeatFinding)) return rows.filter((row) => row.repeat_finding);
    return rows;
  }

  private summary(rows: Row[]) {
    const totalActions = (kind?: string) => rows.reduce((total, row) => total + (kind === "corrective" ? row.corrective_actions ?? 0 : kind === "preventive" ? row.preventive_actions ?? 0 : kind === "containment" ? row.containment_actions ?? 0 : row.open_actions ?? 0), 0);
    return {
      total: rows.length,
      open: rows.filter((row) => row.capa_status === "Open").length,
      draft: rows.filter((row) => row.capa_status === "Draft").length,
      inProgress: rows.filter((row) => row.capa_status === "In Progress").length,
      overdue: rows.filter((row) => row.overdue_actions > 0 || this.isOverdue(row)).length,
      completed: rows.filter((row) => row.capa_status === "Completed").length,
      pendingVerification: rows.filter((row) => row.verification_status === "Pending Verification").length,
      verificationFailed: rows.filter((row) => row.verification_status === "Rejected" || row.capa_status === "Verification Failed").length,
      effectivenessPending: rows.filter((row) => row.effectiveness_status === "Pending" || row.effectiveness_status === "Scheduled").length,
      ineffective: rows.filter((row) => row.effectiveness_status === "Ineffective").length,
      readyForClosure: rows.filter((row) => row.closure_readiness_status === "Ready For Closure").length,
      closed: rows.filter((row) => row.capa_status === "Closed").length,
      reopened: rows.filter((row) => row.capa_status === "Reopened").length,
      safetyCritical: rows.filter((row) => row.safety_critical).length,
      regulatoryCritical: rows.filter((row) => row.regulatory_critical).length,
      psmCritical: rows.filter((row) => row.criticality === "PSM-Critical").length,
      repeatFindingCapa: rows.filter((row) => row.repeat_finding).length,
      correctiveActionsOpen: totalActions("corrective"),
      preventiveActionsOpen: totalActions("preventive"),
      immediateContainmentsOpen: totalActions("containment"),
      actionsOverdue: rows.reduce((total, row) => total + (row.overdue_actions ?? 0), 0),
      actionsWithoutOwner: rows.filter((row) => !row.capa_owner_user_id).length,
      actionsMissingEvidence: rows.reduce((total, row) => total + (row.actions_missing_evidence ?? 0), 0),
      findingsClosureReady: rows.filter((row) => row.closure_readiness_status === "Ready For Closure").length,
    };
  }

  private async findingsWaitingForCapa(user: RequestUser, query: Row) {
    let req: any = this.db.from("audit_findings").select("*").eq("company_id", user.tenantId).eq("ready_for_capa", true);
    if (query.siteId ?? user.selectedSiteId) req = req.eq("site_id", query.siteId ?? user.selectedSiteId);
    return this.safeRows(req.order("updated_at", { ascending: false }).limit(25));
  }

  private async linkFinding(user: RequestUser, capa: Row, finding: Row, dto: Row = {}) {
    if (finding.site_id && capa.site_id && finding.site_id !== capa.site_id) throw new BadRequestException("Finding and CAPA site scope do not match.");
    const row = await this.db.single<Row>(this.db.from("audit_capa_finding_links").insert({
      company_id: user.tenantId,
      site_id: capa.site_id ?? finding.site_id ?? null,
      capa_id: capa.id,
      finding_id: finding.id,
      link_type: dto.linkType ?? (dto.primaryFinding ? "Primary Finding" : "Related Finding"),
      primary_finding: Boolean(dto.primaryFinding),
      grouping_reason: dto.groupingReason ?? null,
      finding_snapshot_json: dto.findingSnapshot ?? finding,
      linked_by: user.id,
    }).select().single());
    await this.safeSingle(this.db.from("audit_findings").update({ capa_record_id: capa.id, finding_status: "CAPA Created Foundation", capa_readiness_status: "CAPA Created Foundation", updated_by: user.id, updated_at: new Date().toISOString() }).eq("company_id", user.tenantId).eq("id", finding.id).select("id").single());
    return row;
  }

  private async createAction(user: RequestUser, capa: Row, dto: Row) {
    const errors = this.validateAction(dto);
    if (errors.length) throw new BadRequestException(errors.join(" "));
    const row = await this.db.single<Row>(this.db.from("audit_capa_actions").insert(this.actionPayload(user, capa, dto)).select().single());
    await this.writeSync(user, capa, row, "Action Created", "Mapped Foundation", null, row);
    return row;
  }

  private async applyInitialRows(user: RequestUser, capa: Row, dto: Row, finding: Row | null) {
    const allActions = [...(dto.correctiveActions ?? []), ...(dto.preventiveActions ?? []), ...(dto.actions ?? [])];
    for (const action of allActions) await this.createAction(user, capa, { ...action, findingId: action.findingId ?? finding?.id ?? capa.primary_finding_id });
    if (dto.containment) await this.addRow(user, capa.id, "containment", { ...dto.containment, findingId: finding?.id ?? capa.primary_finding_id });
    if (dto.evidenceTitle) await this.addRow(user, capa.id, "evidence", dto);
    if (dto.verification) await this.addRow(user, capa.id, "verification", dto.verification);
    if (dto.effectiveness) await this.addRow(user, capa.id, "effectiveness", dto.effectiveness);
  }

  private capaPayload(user: RequestUser, dto: Row, scoped: Row, code: string, finding: Row | null) {
    return {
      company_id: user.tenantId,
      ...scoped,
      primary_finding_id: dto.primaryFindingId ?? null,
      capa_code: code,
      capa_title: dto.capaTitle,
      capa_description: dto.capaDescription ?? null,
      capa_category: dto.capaCategory ?? "Audit Finding CAPA",
      capa_status: dto.capaStatus ?? "Draft",
      closure_readiness_status: "Not Ready",
      verification_status: dto.verificationStatus ?? "Not Required",
      effectiveness_status: dto.effectivenessStatus ?? "Not Required",
      criticality: dto.criticality ?? finding?.criticality ?? "Medium",
      priority: dto.priority ?? finding?.priority ?? null,
      suspected_cause: dto.suspectedCause ?? null,
      cause_category: dto.causeCategory ?? null,
      system_weakness: dto.systemWeakness ?? null,
      contributing_factors_json: dto.contributingFactors ?? null,
      rca_required: Boolean(dto.rcaRequired),
      rca_method: dto.rcaMethod ?? null,
      rca_record_id: dto.rcaRecordId ?? null,
      capa_owner_user_id: dto.capaOwnerUserId ?? null,
      reviewer_user_id: dto.reviewerUserId ?? null,
      responsible_department_id: dto.responsibleDepartmentId ?? null,
      escalation_owner_user_id: dto.escalationOwnerUserId ?? null,
      overall_due_date: dto.overallDueDate ?? null,
      severity_sla_category: dto.severitySlaCategory ?? null,
      source_snapshot_json: dto.sourceSnapshot ?? (finding ? { finding } : null),
      created_by: user.id,
      updated_by: user.id,
    };
  }

  private capaPatch(user: RequestUser, dto: Row, scoped: Row) {
    const patch: Row = { ...scoped, updated_by: user.id, updated_at: new Date().toISOString() };
    const map: Record<string, string> = {
      capaTitle: "capa_title",
      capaCode: "capa_code",
      capaDescription: "capa_description",
      capaCategory: "capa_category",
      criticality: "criticality",
      priority: "priority",
      suspectedCause: "suspected_cause",
      causeCategory: "cause_category",
      systemWeakness: "system_weakness",
      rcaMethod: "rca_method",
      rcaRecordId: "rca_record_id",
      capaOwnerUserId: "capa_owner_user_id",
      reviewerUserId: "reviewer_user_id",
      responsibleDepartmentId: "responsible_department_id",
      escalationOwnerUserId: "escalation_owner_user_id",
      overallDueDate: "overall_due_date",
      severitySlaCategory: "severity_sla_category",
    };
    for (const [input, column] of Object.entries(map)) if (dto[input] !== undefined) patch[column] = dto[input] ?? null;
    if (dto.contributingFactors !== undefined) patch.contributing_factors_json = dto.contributingFactors ?? null;
    if (dto.rcaRequired !== undefined) patch.rca_required = Boolean(dto.rcaRequired);
    return patch;
  }

  private actionPayload(user: RequestUser, capa: Row, dto: Row) {
    return {
      company_id: user.tenantId,
      site_id: capa.site_id,
      unit_id: dto.unitId ?? capa.unit_id ?? null,
      area_id: dto.areaId ?? capa.area_id ?? null,
      equipment_id: dto.equipmentId ?? capa.equipment_id ?? null,
      capa_id: capa.id,
      finding_id: dto.findingId ?? capa.primary_finding_id ?? null,
      action_engine_id: dto.actionEngineId ?? null,
      action_code: dto.actionCode ?? null,
      action_title: dto.actionTitle,
      action_description: dto.actionDescription ?? null,
      action_type: dto.actionType,
      action_status: dto.actionStatus ?? (dto.ownerUserId ? "Assigned" : "Draft"),
      priority: dto.priority ?? capa.priority ?? "Medium",
      owner_user_id: dto.ownerUserId ?? null,
      verifier_user_id: dto.verifierUserId ?? null,
      responsible_department_id: dto.responsibleDepartmentId ?? capa.responsible_department_id ?? null,
      linked_module: dto.linkedModule ?? null,
      linked_record_id: dto.linkedRecordId ?? null,
      due_date: dto.dueDate ?? null,
      evidence_required: Boolean(dto.evidenceRequired),
      verification_required: Boolean(dto.verificationRequired),
      effectiveness_required: Boolean(dto.effectivenessRequired),
      completion_criteria: dto.completionCriteria ?? null,
      source_action_snapshot_json: dto.sourceActionSnapshot ?? null,
      created_by: user.id,
      updated_by: user.id,
    };
  }

  private containmentPayload(user: RequestUser, capa: Row, dto: Row) {
    return {
      company_id: user.tenantId,
      site_id: capa.site_id,
      unit_id: dto.unitId ?? capa.unit_id ?? null,
      area_id: dto.areaId ?? capa.area_id ?? null,
      equipment_id: dto.equipmentId ?? capa.equipment_id ?? null,
      capa_id: capa.id,
      finding_id: dto.findingId ?? capa.primary_finding_id ?? null,
      containment_required: Boolean(dto.containmentRequired),
      containment_description: dto.containmentDescription ?? null,
      containment_owner_user_id: dto.containmentOwnerUserId ?? null,
      containment_due_date: dto.containmentDueDate ?? null,
      containment_status: dto.containmentStatus ?? "Draft",
      evidence_required: Boolean(dto.evidenceRequired),
      stop_work_recommendation: Boolean(dto.stopWorkRecommendation),
      interim_control_description: dto.interimControlDescription ?? null,
      action_engine_id: dto.actionEngineId ?? null,
      created_by: user.id,
    };
  }

  private evidencePayload(user: RequestUser, capa: Row, dto: Row) {
    if (!dto.evidenceTitle || !dto.evidenceType) throw new BadRequestException("Evidence title and type are required.");
    return {
      company_id: user.tenantId,
      site_id: capa.site_id,
      capa_id: capa.id,
      capa_action_id: dto.capaActionId ?? null,
      finding_id: dto.findingId ?? capa.primary_finding_id ?? null,
      evidence_title: dto.evidenceTitle,
      evidence_type: dto.evidenceType,
      evidence_description: dto.evidenceDescription ?? null,
      document_id: dto.documentId ?? null,
      storage_file_id: dto.storageFileId ?? null,
      action_engine_evidence_id: dto.actionEngineEvidenceId ?? null,
      related_module: dto.relatedModule ?? null,
      related_record_id: dto.relatedRecordId ?? null,
      confidentiality_level: dto.confidentialityLevel ?? null,
      evidence_status: dto.evidenceStatus ?? "Linked",
      uploaded_by: dto.uploadedBy ?? null,
      linked_by: user.id,
    };
  }

  private verificationPayload(user: RequestUser, capa: Row, dto: Row) {
    return {
      company_id: user.tenantId,
      site_id: capa.site_id,
      capa_id: capa.id,
      capa_action_id: dto.capaActionId ?? null,
      finding_id: dto.findingId ?? capa.primary_finding_id ?? null,
      verification_required: dto.verificationRequired !== false,
      verification_method: dto.verificationMethod ?? "Document Review",
      verifier_user_id: dto.verifierUserId ?? null,
      verification_status: dto.verificationStatus ?? "Pending Verification",
      verification_due_date: dto.verificationDueDate ?? null,
      evidence_required: Boolean(dto.evidenceRequired),
    };
  }

  private effectivenessPayload(user: RequestUser, capa: Row, dto: Row) {
    return {
      company_id: user.tenantId,
      site_id: capa.site_id,
      capa_id: capa.id,
      finding_id: dto.findingId ?? capa.primary_finding_id ?? null,
      effectiveness_required: Boolean(dto.effectivenessRequired),
      effectiveness_method: dto.effectivenessMethod ?? null,
      effectiveness_owner_user_id: dto.effectivenessOwnerUserId ?? null,
      effectiveness_due_date: dto.effectivenessDueDate ?? null,
      effectiveness_criteria: dto.effectivenessCriteria ?? null,
      follow_up_audit_required: Boolean(dto.followUpAuditRequired),
      repeat_finding_watch_window_days: dto.repeatFindingWatchWindowDays ? Number(dto.repeatFindingWatchWindowDays) : null,
      effectiveness_status: dto.effectivenessStatus ?? (dto.effectivenessRequired ? "Required" : "Not Required"),
    };
  }

  private sectionPatch(user: RequestUser, capa: Row, section: string, dto: Row) {
    const base: Row = { updated_at: new Date().toISOString() };
    if (section === "actions") return this.withoutUndefined({ ...this.actionPayload(user, capa, { ...dto, actionTitle: dto.actionTitle ?? dto.action_title, actionType: dto.actionType ?? dto.action_type }), id: undefined, created_by: undefined, created_at: undefined });
    if (section === "containment") return this.withoutUndefined({ ...base, ...this.containmentPayload(user, capa, dto), id: undefined, created_by: undefined, created_at: undefined });
    if (section === "evidence") return this.withoutUndefined({ ...base, ...this.evidencePayload(user, capa, dto), id: undefined, created_at: undefined, linked_by: undefined });
    if (section === "verification") return this.withoutUndefined({ ...base, ...this.verificationPayload(user, capa, dto), id: undefined, created_at: undefined });
    if (section === "effectiveness") return this.withoutUndefined({ ...base, ...this.effectivenessPayload(user, capa, dto), id: undefined, created_at: undefined });
    throw new BadRequestException("Unsupported CAPA section update.");
  }

  private async writeVerificationDecision(user: RequestUser, capa: Row, action: Row, decision: string, dto: Row) {
    const existing = await this.safeSingle(this.db.from("audit_capa_verification_records").select("*").eq("company_id", user.tenantId).eq("capa_id", capa.id).eq("capa_action_id", action.id).maybeSingle());
    const payload = {
      company_id: user.tenantId,
      site_id: capa.site_id,
      capa_id: capa.id,
      capa_action_id: action.id,
      finding_id: action.finding_id,
      verification_required: true,
      verification_method: dto.verificationMethod ?? "Document Review",
      verifier_user_id: action.verifier_user_id ?? user.id,
      verification_status: decision === "Verified" ? "Verified" : "Rejected",
      verification_decision: decision,
      verification_comment: dto.verificationComment ?? dto.reason ?? null,
      verified_by: decision === "Verified" ? user.id : null,
      verified_at: decision === "Verified" ? new Date().toISOString() : null,
      rejected_by: decision === "Rejected" ? user.id : null,
      rejected_at: decision === "Rejected" ? new Date().toISOString() : null,
      rejection_reason: decision === "Rejected" ? dto.reason : null,
      rework_required: decision === "Rejected",
      updated_at: new Date().toISOString(),
    };
    if (existing?.id) await this.db.single(this.db.from("audit_capa_verification_records").update(payload).eq("company_id", user.tenantId).eq("id", existing.id).select("id").single());
    else await this.db.single(this.db.from("audit_capa_verification_records").insert(payload).select("id").single());
  }

  private async writeSync(user: RequestUser, capa: Row, action: Row, syncType: string, syncStatus: string, before: Row | null, after: Row | null) {
    return this.db.single(this.db.from("audit_capa_action_sync_events").insert({
      company_id: user.tenantId,
      site_id: capa.site_id,
      capa_id: capa.id,
      capa_action_id: action.id,
      action_engine_id: action.action_engine_id ?? null,
      sync_type: syncType,
      sync_status: syncStatus,
      sync_message: action.action_engine_id ? "Action Engine mapping synchronized." : "Action Engine unavailable or not configured; stored as Audit CAPA foundation mapping.",
      before_value_json: before,
      after_value_json: after,
      triggered_by: user.id,
      completed_at: new Date().toISOString(),
    }).select("id").single());
  }

  private validateAction(dto: Row) {
    const errors: string[] = [];
    if (!dto.actionTitle) errors.push("Action title is required.");
    if (!dto.actionType) errors.push("Action type is required.");
    if (!dto.ownerUserId) errors.push("Action owner is required.");
    if (!dto.dueDate) errors.push("Action due date is required.");
    if (!dto.priority) errors.push("Action priority is required.");
    if (dto.dueDate && Number.isNaN(new Date(dto.dueDate).getTime())) errors.push("Action due date is invalid.");
    return errors;
  }

  private validateOpen(capa: Row, actions: Row[]) {
    const errors: string[] = [];
    if (!capa.primary_finding_id) errors.push("Open CAPA requires source finding.");
    if (!capa.capa_owner_user_id) errors.push("Open CAPA requires CAPA owner.");
    if (!actions.length) errors.push("Open CAPA requires at least one action.");
    return errors;
  }

  private validateFindingForCapa(finding: Row, override = false) {
    if (override) return;
    if (!this.findingIsReadyForCapa(finding)) throw new BadRequestException("CAPA can only be created from confirmed or ready-for-CAPA findings unless override permission is used.");
  }

  private findingIsReadyForCapa(finding: Row) {
    return finding.finding_status === "Confirmed" || finding.finding_status === "Ready For CAPA" || finding.ready_for_capa === true || finding.capa_readiness_status === "Ready For CAPA";
  }

  private validateVerifier(user: RequestUser, action: Row, settings: Row) {
    if (!settings.allow_action_owner_self_verification && action.owner_user_id && action.owner_user_id === user.id) {
      throw new BadRequestException("Action owner cannot verify own action by company/site CAPA settings.");
    }
  }

  private categoryFromFinding(finding: Row) {
    if (finding.safety_critical) return "Safety-Critical CAPA";
    if (finding.regulatory_critical) return "Regulatory CAPA";
    if (finding.psm_critical) return "PSM System CAPA";
    if (finding.repeat_finding) return "Repeat Finding CAPA";
    return "Audit Finding CAPA";
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
    };
  }

  private async capa(user: RequestUser, id: string) {
    const row = await this.safeSingle(this.db.from("audit_capa_packages").select("*").eq("company_id", user.tenantId).eq("id", id).maybeSingle());
    if (!row) throw new NotFoundException("Audit CAPA package not found.");
    if (row.site_id) this.assertSite(user, row.site_id);
    return row;
  }

  private async action(user: RequestUser, capaId: string, actionId: string) {
    const row = await this.safeSingle(this.db.from("audit_capa_actions").select("*").eq("company_id", user.tenantId).eq("capa_id", capaId).eq("id", actionId).maybeSingle());
    if (!row) throw new NotFoundException("Audit CAPA action not found.");
    return row;
  }

  private async finding(user: RequestUser, id: string) {
    const row = await this.safeSingle(this.db.from("audit_findings").select("*").eq("company_id", user.tenantId).eq("id", id).maybeSingle());
    if (!row) throw new NotFoundException("Audit finding not found.");
    if (row.site_id) this.assertSite(user, row.site_id);
    return row;
  }

  private childRows(table: string, capa: Row, order = "created_at") {
    return this.safeRows(this.db.from(table).select("*").eq("company_id", capa.company_id).eq("capa_id", capa.id).order(order, { ascending: false }));
  }

  private sectionTable(section: string) {
    const tables: Record<string, string> = {
      findings: "audit_capa_finding_links",
      actions: "audit_capa_actions",
      containment: "audit_capa_containment_records",
      evidence: "audit_capa_action_evidence_links",
      verification: "audit_capa_verification_records",
      effectiveness: "audit_capa_effectiveness_checks",
    };
    const table = tables[section];
    if (!table) throw new BadRequestException("Unsupported CAPA section.");
    return table;
  }

  private async nextCode(user: RequestUser, siteId: string | null) {
    let query: any = this.db.from("audit_capa_packages").select("id", { count: "exact", head: true }).eq("company_id", user.tenantId);
    query = siteId ? query.eq("site_id", siteId) : query.is("site_id", null);
    const { count, error } = await query;
    if (error) throw new BadRequestException(error.message);
    return `ACAPA-${new Date().getFullYear()}-${String((count ?? 0) + 1).padStart(6, "0")}`;
  }

  private settingsPatch(dto: Row) {
    const patch: Row = {};
    for (const [input, column] of Object.entries({
      requireCapaForConfirmedFindings: "require_capa_for_confirmed_findings",
      requireCapaForSafetyCritical: "require_capa_for_safety_critical",
      requireCapaForRegulatoryCritical: "require_capa_for_regulatory_critical",
      requireCapaForRepeatFindings: "require_capa_for_repeat_findings",
      requireContainmentDecisionForSafetyCritical: "require_containment_decision_for_safety_critical",
      requireCorrectiveActionForNonConformance: "require_corrective_action_for_non_conformance",
      requirePreventiveActionForRepeatFindings: "require_preventive_action_for_repeat_findings",
      requireVerificationForSafetyCriticalActions: "require_verification_for_safety_critical_actions",
      requireEffectivenessForSafetyCriticalCapa: "require_effectiveness_for_safety_critical_capa",
      requireEffectivenessForRepeatFindings: "require_effectiveness_for_repeat_findings",
      allowFindingClosureWithoutCapa: "allow_finding_closure_without_capa",
      allowActionOwnerSelfVerification: "allow_action_owner_self_verification",
      autoCreateActionsInActionEngine: "auto_create_actions_in_action_engine",
      autoSyncActionStatus: "auto_sync_action_status",
      autoMarkOverdue: "auto_mark_overdue",
      autoNotifyActionOwner: "auto_notify_action_owner",
      autoNotifyVerifier: "auto_notify_verifier",
      autoNotifyOverdueToEscalationOwner: "auto_notify_overdue_to_escalation_owner",
      settingsJson: "settings_json",
    })) if (dto[input] !== undefined) patch[column] = dto[input];
    return patch;
  }

  private group(rows: Row[], key: string) {
    return Object.values(rows.reduce((acc: Record<string, Row>, row) => {
      const value = row[key] ?? "Unassigned";
      acc[value] = acc[value] ?? { key: value, label: value, count: 0 };
      acc[value].count += 1;
      return acc;
    }, {}));
  }

  private isOverdue(row: Row) {
    const date = row.due_date ?? row.overall_due_date;
    if (!date || ["Closed", "Cancelled", "Archived", "Verified"].includes(row.action_status ?? row.capa_status)) return false;
    return new Date(date).getTime() < Date.now();
  }

  private async event(user: RequestUser, capa: Row, title: string, description: string, before: Row | null, after: Row | null) {
    await this.history.write({
      tenantId: user.tenantId,
      siteId: capa.site_id,
      unitId: capa.unit_id,
      areaId: capa.area_id,
      programId: capa.program_id,
      planId: capa.plan_id,
      executionId: capa.execution_id,
      findingId: capa.primary_finding_id ?? before?.finding_id ?? after?.finding_id ?? null,
      capaId: capa.id,
      capaActionId: before?.capa_action_id ?? after?.capa_action_id ?? ((before?.action_title || after?.action_title) ? before?.id ?? after?.id ?? null : null),
      actionEngineId: before?.action_engine_id ?? after?.action_engine_id ?? null,
      actorId: user.id,
      type: title,
      title,
      description,
      before,
      after,
    });
  }

  private assertEditable(capa: Row) {
    if (CAPA_LOCKED.includes(capa.capa_status)) throw new ForbiddenException("Closed, cancelled, and archived CAPA records are read-only unless reopened.");
  }

  private assertSite(user: RequestUser, siteId: string) {
    if (user.isSuperAdmin || user.isCompanyAdmin || user.corporateView) return;
    if (!user.siteIds.includes(siteId)) throw new ForbiddenException("Audit CAPA site is outside your site access.");
  }

  private canSeeSite(user: RequestUser, siteId?: string | null) {
    return !siteId || user.isSuperAdmin || user.isCompanyAdmin || user.corporateView || user.siteIds.includes(siteId);
  }

  private truthy(value: unknown) {
    return value === true || value === "true" || value === "1" || value === 1;
  }

  private title(value: string) {
    return value.split("-").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ");
  }

  private withoutUndefined(row: Row) {
    return Object.fromEntries(Object.entries(row).filter(([, value]) => value !== undefined));
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
