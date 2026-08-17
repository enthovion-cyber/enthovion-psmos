import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { RequestUser } from "../common/decorators/current-user.decorator";
import { SupabaseService } from "../database/supabase.service";
import { auditableModules, criticalityLevels, standardOptions } from "./audit-compliance.constants";
import { AuditEvidenceHistoryService } from "./audit-evidence-history.service";

type Row = Record<string, any>;

const EVIDENCE_STATUSES = ["Draft", "Required", "Requested", "Pending Upload", "Pending Link", "Collected", "Pending Review", "In Review", "Verified", "Rejected", "Rework Required", "Missing", "Partial", "Restricted", "Expired", "Superseded", "Archived", "Removed"];
const EVIDENCE_TYPES = ["Document Control", "Storage File", "Photo", "Screenshot", "Interview Record", "Walkthrough Record", "Checklist Response Evidence", "Finding Evidence", "CAPA Evidence", "Module Record", "Action Engine Evidence", "Text Evidence Note", "External Reference", "Other"];
const SOURCE_MODES = ["Upload file", "Link existing Document Control document", "Link existing PSM module record", "Link Action Engine evidence", "Link existing audit evidence", "Text evidence note", "External reference foundation"];
const REVIEW_STATUSES = ["Not Required", "Pending Review", "In Review", "Verified", "Rejected", "Rework Required", "Waived Foundation"];
const REQUIREMENT_STATUSES = ["Open", "Missing", "Partially Fulfilled", "Fulfilled", "Waived", "Overdue", "Cancelled"];
const REQUEST_STATUSES = ["Draft", "Sent", "Acknowledged", "Evidence Submitted", "Pending Review", "Fulfilled", "Rejected", "Rework Required", "Overdue", "Cancelled"];
const READINESS_STATUSES = ["Not Ready", "Missing Required Evidence", "Pending Review", "Rework Required", "Restricted Evidence", "Verified", "Ready For Scoring", "Ready For Review", "Ready For Report Package"];
const ACCESS_STATUSES = ["Allowed", "Denied", "Restricted", "Expired", "Superseded", "Logged"];
const CONFIDENTIALITY_LEVELS = ["Public", "Internal", "Confidential", "Restricted", "Medical / Personal", "Regulatory Sensitive", "Legal Privileged"];
const VERIFICATION_METHODS = ["Document Review", "Field Verification", "Record Verification", "Photo Verification", "System Screenshot Verification", "Supervisor Verification", "HSE Verification", "Process Safety Verification", "Audit Lead Verification", "Custom"];
const LOCKED_STATUSES = ["Verified", "Archived", "Removed", "Superseded"];
const RESTRICTED_LEVELS = ["Restricted", "Medical / Personal", "Legal Privileged"];

@Injectable()
export class AuditEvidenceService {
  constructor(
    private readonly db: SupabaseService,
    private readonly history: AuditEvidenceHistoryService,
  ) {}

  lookups() {
    return {
      evidenceStatuses: EVIDENCE_STATUSES,
      evidenceTypes: EVIDENCE_TYPES,
      evidenceSourceModes: SOURCE_MODES,
      evidenceReviewStatuses: REVIEW_STATUSES,
      evidenceRequirementStatuses: REQUIREMENT_STATUSES,
      evidenceRequestStatuses: REQUEST_STATUSES,
      evidenceReadinessStatuses: READINESS_STATUSES,
      evidenceAccessStatuses: ACCESS_STATUSES,
      evidenceConfidentialityLevels: CONFIDENTIALITY_LEVELS,
      evidenceVerificationMethods: VERIFICATION_METHODS,
      priorities: ["Low", "Medium", "High", "Urgent", "Immediate"],
      criticalityLevels,
      auditableModules: auditableModules.map(([key, label]) => ({ key, label })),
      standardOptions,
    };
  }

  async context(user: RequestUser) {
    const [sites, units, areas, users, programs, plans, executions, findings, capas, requirements, settings] = await Promise.all([
      this.safeRows(this.db.from("Site").select("id,name,tenantId").eq("tenantId", user.tenantId).order("name")),
      this.safeRows(this.db.from("Unit").select("id,name,siteId,tenantId").eq("tenantId", user.tenantId).order("name")),
      this.safeRows(this.db.from("Area").select("id,name,siteId,unitId,tenantId").eq("tenantId", user.tenantId).order("name")),
      this.safeRows(this.db.from("User").select("id,name,email,role,department,isActive,tenantId").eq("tenantId", user.tenantId).order("name")),
      this.safeRows(this.db.from("audit_programs").select("id,program_code,program_title,site_id").eq("company_id", user.tenantId).order("program_title")),
      this.safeRows(this.db.from("audit_plans").select("id,plan_code,plan_title,program_id,site_id").eq("company_id", user.tenantId).order("plan_title")),
      this.safeRows(this.db.from("audit_executions").select("id,execution_code,execution_title,program_id,plan_id,site_id,unit_id,area_id").eq("company_id", user.tenantId).order("updated_at", { ascending: false })),
      this.safeRows(this.db.from("audit_findings").select("id,finding_code,finding_title,site_id,program_id,plan_id,execution_id,evidence_status,capa_readiness_status").eq("company_id", user.tenantId).order("updated_at", { ascending: false })),
      this.safeRows(this.db.from("audit_capa_packages").select("id,capa_code,capa_title,site_id,program_id,plan_id,execution_id,primary_finding_id,closure_readiness_status").eq("company_id", user.tenantId).order("updated_at", { ascending: false })),
      this.safeRows(this.db.from("audit_evidence_requirements").select("*").eq("company_id", user.tenantId).order("updated_at", { ascending: false })),
      this.settings(user, user.selectedSiteId ?? null),
    ]);
    return {
      sites: sites.filter((site: Row) => this.canSeeSite(user, site.id)),
      units,
      areas,
      users: users.filter((u: Row) => u.isActive !== false),
      programs: programs.filter((row: Row) => this.canSeeSite(user, row.site_id)),
      plans: plans.filter((row: Row) => this.canSeeSite(user, row.site_id)),
      executions: executions.filter((row: Row) => this.canSeeSite(user, row.site_id)),
      findings: findings.filter((row: Row) => this.canSeeSite(user, row.site_id)),
      capas: capas.filter((row: Row) => this.canSeeSite(user, row.site_id)),
      requirements: requirements.filter((row: Row) => this.canSeeSite(user, row.site_id)),
      settings,
      lookups: this.lookups(),
    };
  }

  async dashboard(user: RequestUser, query: Row = {}) {
    const register = await this.register(user, { ...query, page: 1, limit: 1000 });
    const rows = register.rows;
    const requirements = await this.requirements(user, query);
    const requests = await this.requests(user, query);
    const gaps = await this.gaps(user, query);
    const access = await this.accessLog(user, { ...query, limit: 100 });
    return {
      summary: this.summary(rows, requirements.rows, requests.rows, gaps.rows),
      bySite: this.group(rows, "site_id"),
      byProgram: this.group(rows, "program_id"),
      byPlan: this.group(rows, "plan_id"),
      byExecution: this.group(rows, "execution_id"),
      byFinding: this.group(rows, "finding_id"),
      byCapa: this.group(rows, "capa_id"),
      bySourceModule: this.group(rows, "linked_module"),
      byDocumentType: this.group(rows, "evidence_type"),
      missing: rows.filter((row: Row) => row.evidence_status === "Missing" || row.readiness_status === "Missing Required Evidence"),
      pendingReview: rows.filter((row: Row) => row.review_status === "Pending Review" || row.evidence_status === "Pending Review"),
      rejected: rows.filter((row: Row) => row.evidence_status === "Rejected" || row.review_status === "Rejected"),
      restricted: rows.filter((row: Row) => this.isRestricted(row)),
      safetyCritical: rows.filter((row: Row) => row.criticality === "Safety-Critical"),
      requestsDueSoon: requests.rows.filter((row: Row) => this.isDueSoon(row.due_date)),
      requestsOverdue: requests.rows.filter((row: Row) => this.isOverdue(row.due_date) && !["Fulfilled", "Cancelled"].includes(row.request_status)),
      recent: rows.slice(0, 12),
      recentUploads: rows.filter((row: Row) => row.storage_file_id || row.document_id).slice(0, 12),
      recentAccess: access.rows.slice(0, 12),
      readiness: { gaps: gaps.rows.length, requirementsOpen: requirements.rows.filter((row: Row) => !["Fulfilled", "Waived", "Cancelled"].includes(row.requirement_status)).length },
    };
  }

  async register(user: RequestUser, query: Row = {}) {
    const page = Math.max(1, Number(query.page ?? 1));
    const limit = Math.min(250, Math.max(1, Number(query.limit ?? 25)));
    let request: any = this.db.from("audit_evidence_records").select("*", { count: "exact" }).eq("company_id", user.tenantId);
    if (Array.isArray(query.evidenceIds)) {
      if (!query.evidenceIds.length) return { rows: [], total: 0, page, limit, summary: this.summary([]) };
      request = request.in("id", query.evidenceIds);
    }
    if (!this.truthy(query.includeRemoved)) request = request.is("removed_at", null);
    const scopedSite = query.siteId ?? user.selectedSiteId;
    if (scopedSite) {
      this.assertSite(user, String(scopedSite));
      request = request.eq("site_id", scopedSite);
    } else if (user.selectedSiteId && !user.corporateView) request = request.eq("site_id", user.selectedSiteId);
    for (const [input, column] of Object.entries({
      status: "evidence_status",
      evidenceStatus: "evidence_status",
      reviewStatus: "review_status",
      readinessStatus: "readiness_status",
      evidenceType: "evidence_type",
      criticality: "criticality",
      confidentialityLevel: "confidentiality_level",
      sourceMode: "source_mode",
      linkedModule: "linked_module",
      linkedRecordId: "linked_record_id",
      documentId: "document_id",
      ownerUserId: "evidence_owner_user_id",
      reviewerUserId: "reviewer_user_id",
      unitId: "unit_id",
      areaId: "area_id",
    })) {
      if (query[input]) request = request.eq(column, query[input]);
    }
    if (query.search) {
      const search = String(query.search).replace(/[,%()]/g, " ").trim();
      if (search) request = request.or(`evidence_code.ilike.%${search}%,evidence_title.ilike.%${search}%,evidence_description.ilike.%${search}%`);
    }
    const sort = String(query.sort ?? "updated_at.desc");
    const [sortColumn, direction] = sort.split(".");
    const { data, count, error } = await request.order(sortColumn || "updated_at", { ascending: direction === "asc" }).range((page - 1) * limit, page * limit - 1);
    if (error) throw new BadRequestException(error.message);
    const scoped = (data ?? []).filter((row: Row) => this.canSeeEvidence(user, row)).map((row: Row) => this.redactEvidence(user, row));
    const filtered = this.applyViewFilter(scoped, query);
    const [requirements, requests, gaps] = await Promise.all([this.requirements(user, query), this.requests(user, query), this.gaps(user, query)]);
    return { rows: filtered, total: count ?? filtered.length, page, limit, summary: this.summary(filtered, requirements.rows, requests.rows, gaps.rows) };
  }

  async detail(user: RequestUser, evidenceId: string) {
    const evidence = await this.evidence(user, evidenceId);
    const [links, reviews, custody, access, history] = await Promise.all([
      this.childRows("audit_evidence_links", user, "evidence_id", evidence.id),
      this.childRows("audit_evidence_reviews", user, "evidence_id", evidence.id),
      this.childRows("audit_evidence_chain_of_custody_events", user, "evidence_id", evidence.id, "created_at"),
      this.childRows("audit_evidence_access_events", user, "evidence_id", evidence.id, "accessed_at"),
      this.childRows("audit_evidence_history_events", user, "evidence_id", evidence.id, "created_at"),
    ]);
    return { evidence: this.redactEvidence(user, evidence), links, reviews, custody, access, history, calculated: this.calculateEvidence(evidence, links, reviews) };
  }

  async create(user: RequestUser, dto: Row) {
    const scoped = await this.resolveScope(user, dto);
    const code = dto.evidenceCode || await this.nextCode(user, scoped.site_id);
    const payload = this.evidencePayload(user, dto, scoped, code);
    const after = await this.db.single<Row>(this.db.from("audit_evidence_records").insert(payload).select().single());
    await this.createPrimaryLinkIfPresent(user, after, dto, scoped);
    await this.custody(user, after, "Created", "Evidence Created", "Audit evidence record created", null, after);
    await this.event(user, after, "Evidence Created", "Audit evidence record created", null, after);
    await this.recalculateRecord(user, after.id);
    return this.detail(user, after.id);
  }

  async update(user: RequestUser, evidenceId: string, dto: Row) {
    const before = await this.evidence(user, evidenceId);
    this.assertEditable(before, dto);
    const scoped = await this.resolveScope(user, { ...before, ...dto });
    const patch = this.evidencePatch(user, dto, scoped);
    const after = await this.db.single<Row>(this.db.from("audit_evidence_records").update(patch).eq("company_id", user.tenantId).eq("id", evidenceId).select().single());
    await this.custody(user, after, "Updated", "Evidence Updated", "Audit evidence metadata updated", before, after);
    await this.event(user, after, "Evidence Updated", "Audit evidence metadata updated", before, after);
    await this.recalculateRecord(user, after.id);
    return this.detail(user, after.id);
  }

  async transition(user: RequestUser, evidenceId: string, action: string, dto: Row = {}) {
    const before = await this.evidence(user, evidenceId);
    const now = new Date().toISOString();
    const patch: Row = { updated_by: user.id, updated_at: now };
    let title = "Evidence Updated";
    if (action === "replace") {
      if (!dto.reason) throw new BadRequestException("Replacement requires reason.");
      patch.evidence_status = "Superseded"; patch.superseded_at = now; title = "Evidence Replaced";
    } else if (action === "remove") {
      if (!dto.reason) throw new BadRequestException("Removal requires reason.");
      patch.evidence_status = "Removed"; patch.removed_by = user.id; patch.removed_at = now; patch.remove_reason = dto.reason; title = "Evidence Removed";
    } else if (action === "archive") {
      patch.evidence_status = "Archived"; patch.archived_by = user.id; patch.archived_at = now; patch.archive_reason = dto.reason ?? null; title = "Evidence Archived";
    } else if (action === "submit-review") {
      if (!before.reviewer_user_id && !dto.reviewerUserId) throw new BadRequestException("Submit for review requires reviewer.");
      patch.review_status = "Pending Review"; patch.evidence_status = "Pending Review"; title = "Evidence Submitted For Review";
    } else if (action === "mark-restricted") {
      patch.confidentiality_level = "Restricted"; patch.evidence_status = "Restricted"; title = "Evidence Marked Restricted";
    } else if (action === "mark-superseded") {
      patch.evidence_status = "Superseded"; patch.superseded_at = now; patch.superseded_by_evidence_id = dto.supersededByEvidenceId ?? null; title = "Evidence Marked Superseded";
    } else if (action === "mark-stale") {
      patch.readiness_status = "Not Ready"; patch.review_status = "Rework Required"; patch.evidence_status = "Rework Required"; title = "Evidence Marked Stale";
    } else throw new BadRequestException("Unsupported evidence transition.");
    const after = await this.db.single<Row>(this.db.from("audit_evidence_records").update(patch).eq("company_id", user.tenantId).eq("id", evidenceId).select().single());
    await this.custody(user, after, action, title, dto.reason ?? title, before, after);
    await this.event(user, after, title, dto.reason ?? title, before, after);
    return this.detail(user, evidenceId);
  }

  async review(user: RequestUser, evidenceId: string, decision: string, dto: Row = {}) {
    const before = await this.evidence(user, evidenceId);
    if (["Reject", "Request Rework"].includes(decision) && !dto.reason && !dto.reviewComment) throw new BadRequestException("Reject/rework requires reason.");
    const now = new Date().toISOString();
    const review = await this.db.single<Row>(this.db.from("audit_evidence_reviews").insert({
      company_id: user.tenantId,
      site_id: before.site_id,
      evidence_id: evidenceId,
      review_decision: decision,
      review_status: decision === "Verify" ? "Verified" : decision === "Reject" ? "Rejected" : "Rework Required",
      verification_method: dto.verificationMethod ?? "Document Review",
      review_comment: dto.reviewComment ?? dto.reason ?? null,
      quality_rating: dto.qualityRating ?? null,
      missing_information: dto.missingInformation ?? null,
      rework_instructions: dto.reworkInstructions ?? null,
      reviewed_by: user.id,
      reviewed_at: now,
    }).select().single());
    const patch = decision === "Verify"
      ? { evidence_status: "Verified", review_status: "Verified", readiness_status: "Verified", verified_by: user.id, verified_at: now, updated_by: user.id, updated_at: now }
      : decision === "Reject"
        ? { evidence_status: "Rejected", review_status: "Rejected", readiness_status: "Rework Required", rejected_by: user.id, rejected_at: now, rejection_reason: dto.reason ?? dto.reviewComment, updated_by: user.id, updated_at: now }
        : { evidence_status: "Rework Required", review_status: "Rework Required", readiness_status: "Rework Required", updated_by: user.id, updated_at: now };
    const after = await this.db.single<Row>(this.db.from("audit_evidence_records").update(patch).eq("company_id", user.tenantId).eq("id", evidenceId).select().single());
    await this.custody(user, after, decision, `Evidence ${decision}`, dto.reviewComment ?? dto.reason ?? decision, before, after);
    await this.event(user, after, `Evidence ${decision}`, dto.reviewComment ?? dto.reason ?? decision, before, after);
    return { ...(await this.detail(user, evidenceId)), review };
  }

  async links(user: RequestUser, evidenceId: string) {
    await this.evidence(user, evidenceId);
    return this.childRows("audit_evidence_links", user, "evidence_id", evidenceId);
  }

  async addLink(user: RequestUser, evidenceId: string, dto: Row) {
    const evidence = await this.evidence(user, evidenceId);
    const link = await this.db.single<Row>(this.db.from("audit_evidence_links").insert(this.linkPayload(user, evidence, dto)).select().single());
    await this.custody(user, evidence, "Linked", "Evidence Linked", dto.linkReason ?? "Evidence linked to source object.", null, link);
    await this.event(user, evidence, "Evidence Linked", dto.linkReason ?? "Evidence linked to source object.", null, link);
    await this.recalculateRecord(user, evidenceId);
    return this.detail(user, evidenceId);
  }

  async removeLink(user: RequestUser, evidenceId: string, linkId: string, dto: Row = {}) {
    const evidence = await this.evidence(user, evidenceId);
    if (!dto.reason) throw new BadRequestException("Removing evidence link requires reason.");
    const before = await this.single(user, "audit_evidence_links", linkId);
    const after = await this.db.single<Row>(this.db.from("audit_evidence_links").update({ removed_by: user.id, removed_at: new Date().toISOString(), remove_reason: dto.reason }).eq("company_id", user.tenantId).eq("id", linkId).select().single());
    await this.custody(user, evidence, "Unlinked", "Evidence Link Removed", dto.reason, before, after);
    await this.event(user, evidence, "Evidence Link Removed", dto.reason, before, after);
    return this.detail(user, evidenceId);
  }

  async requirements(user: RequestUser, query: Row = {}) {
    return this.tableRegister(user, "audit_evidence_requirements", query, "requirement_status", ["requirement_title", "requirement_code", "acceptance_criteria"]);
  }

  async saveRequirement(user: RequestUser, dto: Row, requirementId?: string) {
    const scoped = await this.resolveScope(user, dto);
    const payload = this.requirementPayload(user, dto, scoped);
    const before = requirementId ? await this.single(user, "audit_evidence_requirements", requirementId) : null;
    const row = requirementId
      ? await this.db.single<Row>(this.db.from("audit_evidence_requirements").update({ ...payload, updated_by: user.id, updated_at: new Date().toISOString() }).eq("company_id", user.tenantId).eq("id", requirementId).select().single())
      : await this.db.single<Row>(this.db.from("audit_evidence_requirements").insert({ ...payload, requirement_code: dto.requirementCode ?? await this.nextRequirementCode(user, scoped.site_id) }).select().single());
    await this.event(user, this.eventScope(row), requirementId ? "Requirement Updated" : "Requirement Created", "Audit evidence requirement saved", before, row, { requirementId: row.id });
    return row;
  }

  async waiveRequirement(user: RequestUser, requirementId: string, dto: Row) {
    if (!dto.reason) throw new BadRequestException("Requirement waiver requires reason.");
    const before = await this.single(user, "audit_evidence_requirements", requirementId);
    const row = await this.db.single<Row>(this.db.from("audit_evidence_requirements").update({ waived: true, waiver_reason: dto.reason, waived_by: user.id, waived_at: new Date().toISOString(), requirement_status: "Waived", updated_by: user.id, updated_at: new Date().toISOString() }).eq("company_id", user.tenantId).eq("id", requirementId).select().single());
    await this.event(user, this.eventScope(row), "Requirement Waived", dto.reason, before, row, { requirementId });
    return row;
  }

  async requests(user: RequestUser, query: Row = {}) {
    return this.tableRegister(user, "audit_evidence_requests", query, "request_status", ["request_title", "request_code", "request_description"]);
  }

  async saveRequest(user: RequestUser, dto: Row, requestId?: string) {
    const scoped = await this.resolveScope(user, dto);
    const payload = this.requestPayload(user, dto, scoped);
    const before = requestId ? await this.single(user, "audit_evidence_requests", requestId) : null;
    const row = requestId
      ? await this.db.single<Row>(this.db.from("audit_evidence_requests").update({ ...payload, updated_at: new Date().toISOString() }).eq("company_id", user.tenantId).eq("id", requestId).select().single())
      : await this.db.single<Row>(this.db.from("audit_evidence_requests").insert({ ...payload, request_code: dto.requestCode ?? await this.nextRequestCode(user, scoped.site_id) }).select().single());
    await this.event(user, this.eventScope(row), requestId ? "Request Updated" : "Request Created", "Audit evidence request saved", before, row, { requestId: row.id });
    return row;
  }

  async requestTransition(user: RequestUser, requestId: string, action: string, dto: Row = {}) {
    const before = await this.single(user, "audit_evidence_requests", requestId);
    const patch: Row = { updated_at: new Date().toISOString() };
    if (action === "send") {
      if (!before.due_date) throw new BadRequestException("Request due date is required before sending.");
      patch.request_status = "Sent"; patch.requested_by = user.id; patch.requested_at = new Date().toISOString();
    } else if (action === "acknowledge") { patch.request_status = "Acknowledged"; patch.acknowledged_by = user.id; patch.acknowledged_at = new Date().toISOString(); }
    else if (action === "cancel") { if (!dto.reason) throw new BadRequestException("Cancel request requires reason."); patch.request_status = "Cancelled"; patch.cancelled_by = user.id; patch.cancelled_at = new Date().toISOString(); patch.cancel_reason = dto.reason; }
    else if (action === "reopen") patch.request_status = "Sent";
    else throw new BadRequestException("Unsupported request transition.");
    const row = await this.db.single<Row>(this.db.from("audit_evidence_requests").update(patch).eq("company_id", user.tenantId).eq("id", requestId).select().single());
    await this.event(user, this.eventScope(row), `Request ${action}`, dto.reason ?? `Evidence request ${action}`, before, row, { requestId });
    return row;
  }

  async submitRequestEvidence(user: RequestUser, requestId: string, dto: Row = {}) {
    const request = await this.single(user, "audit_evidence_requests", requestId);
    if (!dto.evidenceId) throw new BadRequestException("Request submission requires evidence ID.");
    await this.evidence(user, String(dto.evidenceId));
    const row = await this.db.single<Row>(this.db.from("audit_evidence_request_submissions").insert({
      company_id: user.tenantId,
      site_id: request.site_id,
      request_id: requestId,
      evidence_id: dto.evidenceId,
      submitted_by: user.id,
      submission_note: dto.submissionNote ?? null,
      submission_status: "Submitted",
    }).select().single());
    await this.db.single(this.db.from("audit_evidence_requests").update({ request_status: "Evidence Submitted", updated_at: new Date().toISOString() }).eq("company_id", user.tenantId).eq("id", requestId).select("id").single());
    await this.event(user, this.eventScope(request), "Request Evidence Submitted", dto.submissionNote ?? "Evidence submitted for request", null, row, { requestId, evidenceId: dto.evidenceId });
    return row;
  }

  async gaps(user: RequestUser, query: Row = {}) {
    return this.tableRegister(user, "audit_evidence_gaps", query, "gap_status", ["gap_title", "gap_description"]);
  }

  async detectGaps(user: RequestUser, query: Row = {}) {
    const requirements = await this.requirements(user, query);
    const open = requirements.rows.filter((row: Row) => row.mandatory && !row.waived && !["Fulfilled", "Waived", "Cancelled"].includes(row.requirement_status));
    const created: Row[] = [];
    for (const requirement of open) {
      const existing = await this.safeSingle(this.db.from("audit_evidence_gaps").select("id").eq("company_id", user.tenantId).eq("requirement_id", requirement.id).is("resolved_at", null).maybeSingle());
      if (existing?.id) continue;
      const row = await this.db.single<Row>(this.db.from("audit_evidence_gaps").insert({
        company_id: user.tenantId,
        site_id: requirement.site_id,
        unit_id: requirement.unit_id,
        area_id: requirement.area_id,
        source_module: requirement.source_module,
        source_record_id: requirement.source_record_id,
        requirement_id: requirement.id,
        gap_title: `Missing evidence: ${requirement.requirement_title}`,
        gap_description: requirement.acceptance_criteria,
        gap_status: "Open",
        gap_severity: requirement.criticality ?? "Medium",
        criticality: requirement.criticality ?? "Medium",
        owner_user_id: requirement.owner_user_id,
        due_date: requirement.due_date,
      }).select().single());
      created.push(row);
    }
    return { created, totalCreated: created.length };
  }

  async resolveGap(user: RequestUser, gapId: string, dto: Row = {}) {
    if (!dto.resolutionNote) throw new BadRequestException("Resolving evidence gap requires resolution note.");
    const before = await this.single(user, "audit_evidence_gaps", gapId);
    const row = await this.db.single<Row>(this.db.from("audit_evidence_gaps").update({ gap_status: "Resolved", resolved_by: user.id, resolved_at: new Date().toISOString(), resolution_note: dto.resolutionNote, updated_at: new Date().toISOString() }).eq("company_id", user.tenantId).eq("id", gapId).select().single());
    await this.event(user, this.eventScope(row), "Evidence Gap Resolved", dto.resolutionNote, before, row);
    return row;
  }

  async packages(user: RequestUser, query: Row = {}) {
    return this.tableRegister(user, "audit_evidence_package_foundations", query, "package_status", ["package_title", "package_code"]);
  }

  async savePackage(user: RequestUser, dto: Row) {
    const scoped = await this.resolveScope(user, dto);
    const row = await this.db.single<Row>(this.db.from("audit_evidence_package_foundations").insert({
      company_id: user.tenantId,
      site_id: scoped.site_id,
      package_code: dto.packageCode ?? await this.nextPackageCode(user, scoped.site_id),
      package_title: dto.packageTitle,
      package_type: dto.packageType ?? "Audit Evidence Package Foundation",
      source_module: dto.sourceModule ?? "Audit Evidence Collection",
      source_record_id: dto.sourceRecordId ?? "general",
      package_status: "Draft",
      prepared_by: user.id,
    }).select().single());
    await this.event(user, this.eventScope(row), "Evidence Package Foundation Created", "Evidence package foundation created", null, row);
    return row;
  }

  async addPackageEvidence(user: RequestUser, packageId: string, dto: Row) {
    const pkg = await this.single(user, "audit_evidence_package_foundations", packageId);
    const evidence = await this.evidence(user, String(dto.evidenceId));
    const row = await this.db.single<Row>(this.db.from("audit_evidence_package_items").insert({
      company_id: user.tenantId,
      site_id: pkg.site_id,
      package_id: packageId,
      evidence_id: evidence.id,
      included: !this.isRestricted(evidence) || this.canViewRestricted(user),
      excluded_reason: this.isRestricted(evidence) && !this.canViewRestricted(user) ? "Restricted evidence excluded by permission." : null,
      confidentiality_level: evidence.confidentiality_level,
      added_by: user.id,
    }).select().single());
    await this.event(user, evidence, "Evidence Included In Package Foundation", "Evidence package item updated", null, row);
    return row;
  }

  async prepareManifest(user: RequestUser, packageId: string) {
    const pkg = await this.single(user, "audit_evidence_package_foundations", packageId);
    const items = await this.childRows("audit_evidence_package_items", user, "package_id", packageId);
    const manifest = { preparedAt: new Date().toISOString(), items: items.map((item: Row) => ({ evidenceId: item.evidence_id, included: item.included, excludedReason: item.excluded_reason })) };
    const row = await this.db.single<Row>(this.db.from("audit_evidence_package_foundations").update({
      package_status: "Manifest Prepared Foundation",
      manifest_json: manifest,
      included_evidence_count: items.filter((item: Row) => item.included).length,
      excluded_evidence_count: items.filter((item: Row) => !item.included).length,
      restricted_evidence_count: items.filter((item: Row) => item.confidentiality_level === "Restricted").length,
      prepared_by: user.id,
      prepared_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }).eq("company_id", user.tenantId).eq("id", packageId).select().single());
    await this.event(user, this.eventScope(row), "Evidence Package Manifest Prepared", "Evidence package foundation manifest prepared", pkg, row);
    return row;
  }

  async accessLog(user: RequestUser, query: Row = {}) {
    return this.tableRegister(user, "audit_evidence_access_events", query, "access_status", ["access_type", "denied_reason"]);
  }

  async access(user: RequestUser, evidenceId: string, accessType: string) {
    const evidence = await this.evidence(user, evidenceId, true);
    const allowed = this.canSeeEvidence(user, evidence);
    const row = await this.db.single<Row>(this.db.from("audit_evidence_access_events").insert({
      company_id: user.tenantId,
      site_id: evidence.site_id,
      evidence_id: evidenceId,
      document_id: evidence.document_id,
      storage_file_id: evidence.storage_file_id,
      access_type: accessType,
      access_status: allowed ? "Allowed" : "Denied",
      accessed_by: user.id,
      denied_reason: allowed ? null : "Restricted or out-of-scope evidence.",
    }).select().single());
    await this.custody(user, evidence, accessType, `Evidence ${accessType}`, row.access_status, null, row);
    if (!allowed) throw new ForbiddenException("Evidence access denied.");
    return { access: row, evidence: this.redactEvidence(user, evidence), message: "Use Document Control/Storage secure preview or download URL where available. Raw storage paths are not exposed." };
  }

  async settings(user: RequestUser, siteId: string | null = null) {
    if (siteId) this.assertSite(user, siteId);
    let query: any = this.db.from("audit_evidence_settings").select("*").eq("company_id", user.tenantId);
    query = siteId ? query.eq("site_id", siteId) : query.is("site_id", null);
    let row = await this.safeSingle(query.maybeSingle());
    if (!row) {
      row = await this.db.single<Row>(this.db.from("audit_evidence_settings").insert({ company_id: user.tenantId, site_id: siteId, updated_by: user.id }).select().single());
    }
    return row;
  }

  async updateSettings(user: RequestUser, dto: Row) {
    const siteId = dto.siteId ?? user.selectedSiteId ?? null;
    const before = await this.settings(user, siteId);
    const map: Record<string, string> = {
      requireReviewForSafetyCriticalEvidence: "require_review_for_safety_critical_evidence",
      requireReviewForRegulatoryCriticalEvidence: "require_review_for_regulatory_critical_evidence",
      requireReviewForRestrictedEvidence: "require_review_for_restricted_evidence",
      allowUploaderSelfVerification: "allow_uploader_self_verification",
      requireReasonForEvidenceRemoval: "require_reason_for_evidence_removal",
      requireReasonForEvidenceReplacement: "require_reason_for_evidence_replacement",
      trackPreviewEvents: "track_preview_events",
      trackDownloadEvents: "track_download_events",
      allowExternalReferenceEvidence: "allow_external_reference_evidence",
      allowTextOnlyEvidence: "allow_text_only_evidence",
      allowEvidencePackageFoundation: "allow_evidence_package_foundation",
      autoCreateGapForMissingMandatoryEvidence: "auto_create_gap_for_missing_mandatory_evidence",
      autoUpdateSourceReadinessOnReview: "auto_update_source_readiness_on_review",
      autoNotifyRequestRecipient: "auto_notify_request_recipient",
      autoNotifyReviewer: "auto_notify_reviewer",
      autoNotifyOwnerOnRejection: "auto_notify_owner_on_rejection",
      settingsJson: "settings_json",
    };
    const patch: Row = { updated_by: user.id, updated_at: new Date().toISOString() };
    for (const [input, column] of Object.entries(map)) if (input in dto) patch[column] = dto[input];
    const after = await this.db.single<Row>(this.db.from("audit_evidence_settings").update(patch).eq("company_id", user.tenantId).eq("id", before.id).select().single());
    await this.history.write({ tenantId: user.tenantId, siteId, actorId: user.id, type: "Settings Updated", title: "Evidence Settings Updated", before, after });
    return after;
  }

  async sourceScopedRegister(user: RequestUser, scope: string, id: string, query: Row = {}) {
    const map: Record<string, string> = {
      site: "siteId",
      unit: "unitId",
      area: "areaId",
    };
    const directKey = map[scope];
    if (directKey) return this.register(user, { ...query, [directKey]: id });
    const linkColumn = this.sourceScopeColumn(scope);
    if (!linkColumn) throw new BadRequestException("Unsupported evidence source scope.");
    const links = await this.safeRows(this.db.from("audit_evidence_links").select("evidence_id,site_id").eq("company_id", user.tenantId).eq(linkColumn, id).is("removed_at", null));
    const evidenceIds = [...new Set(links.filter((row: Row) => this.canSeeSite(user, row.site_id)).map((row: Row) => row.evidence_id).filter(Boolean))];
    return this.register(user, { ...query, evidenceIds });
  }

  async globalHistory(user: RequestUser, query: Row = {}) {
    return this.tableRegister(user, "audit_evidence_history_events", query, undefined, ["event_title", "event_description"]);
  }

  private async recalculateRecord(user: RequestUser, evidenceId: string) {
    const evidence = await this.evidence(user, evidenceId, true);
    const [links, reviews] = await Promise.all([
      this.childRows("audit_evidence_links", user, "evidence_id", evidenceId),
      this.childRows("audit_evidence_reviews", user, "evidence_id", evidenceId),
    ]);
    const calc = this.calculateEvidence(evidence, links, reviews);
    await this.safeSingle(this.db.from("audit_evidence_records").update({ readiness_status: calc.readinessStatus, review_status: calc.reviewStatus, evidence_status: calc.evidenceStatus, updated_at: new Date().toISOString() }).eq("company_id", user.tenantId).eq("id", evidenceId).select("id").single());
  }

  private calculateEvidence(evidence: Row, links: Row[], reviews: Row[]) {
    const activeLinks = links.filter((row) => !row.removed_at);
    const hasSource = activeLinks.length > 0 || evidence.source_mode === "Text evidence note" || Boolean(evidence.text_evidence_note) || Boolean(evidence.external_reference);
    const hasArtifact = Boolean(evidence.document_id || evidence.storage_file_id || evidence.linked_record_id || evidence.text_evidence_note || evidence.external_reference);
    const latestReview = reviews[0];
    const reviewStatus = latestReview?.review_status ?? evidence.review_status ?? "Not Required";
    let readinessStatus = evidence.readiness_status ?? "Not Ready";
    let evidenceStatus = evidence.evidence_status ?? "Draft";
    const missing: string[] = [];
    if (!hasSource) missing.push("Evidence must link to an audit source object or include general evidence reason.");
    if (!hasArtifact) missing.push("Collected evidence requires Document Control, Storage, module record, text note, or external reference.");
    if (this.isRestricted(evidence) && reviewStatus !== "Verified") missing.push("Restricted evidence requires review.");
    if (reviewStatus === "Verified") { readinessStatus = "Verified"; evidenceStatus = "Verified"; }
    else if (reviewStatus === "Rejected") { readinessStatus = "Rework Required"; evidenceStatus = "Rejected"; }
    else if (reviewStatus === "Rework Required") { readinessStatus = "Rework Required"; evidenceStatus = "Rework Required"; }
    else if (missing.length) { readinessStatus = "Missing Required Evidence"; evidenceStatus = evidenceStatus === "Draft" ? "Draft" : "Missing"; }
    else if (reviewStatus === "Pending Review" || evidenceStatus === "Pending Review") { readinessStatus = "Pending Review"; evidenceStatus = "Pending Review"; }
    else { readinessStatus = "Ready For Review"; evidenceStatus = evidenceStatus === "Draft" ? "Collected" : evidenceStatus; }
    return { readinessStatus, reviewStatus, evidenceStatus, missing, linkCount: activeLinks.length, hasArtifact };
  }

  private summary(rows: Row[], requirements: Row[] = [], requests: Row[] = [], gaps: Row[] = []) {
    return {
      totalEvidenceRecords: rows.length,
      evidenceRequirements: requirements.length,
      evidenceRequests: requests.length,
      evidenceCollected: rows.filter((row) => ["Collected", "Pending Review", "Verified"].includes(row.evidence_status)).length,
      evidenceMissing: rows.filter((row) => row.evidence_status === "Missing" || row.readiness_status === "Missing Required Evidence").length + gaps.filter((row) => row.gap_status !== "Resolved").length,
      evidencePendingReview: rows.filter((row) => row.review_status === "Pending Review" || row.evidence_status === "Pending Review").length,
      evidenceVerified: rows.filter((row) => row.evidence_status === "Verified" || row.review_status === "Verified").length,
      evidenceRejected: rows.filter((row) => row.evidence_status === "Rejected" || row.review_status === "Rejected").length,
      evidenceReworkRequired: rows.filter((row) => row.evidence_status === "Rework Required" || row.review_status === "Rework Required").length,
      evidenceRestricted: rows.filter((row) => this.isRestricted(row)).length,
      evidenceExpiredSuperseded: rows.filter((row) => row.evidence_status === "Expired" || row.evidence_status === "Superseded" || row.superseded_at || this.isOverdue(row.expires_at)).length,
      documentControlLinks: rows.filter((row) => row.document_id).length,
      psmModuleLinks: rows.filter((row) => row.linked_module && row.linked_record_id).length,
      uploadedEvidenceFiles: rows.filter((row) => row.storage_file_id).length,
      safetyCriticalEvidence: rows.filter((row) => row.criticality === "Safety-Critical").length,
      regulatoryCriticalEvidence: rows.filter((row) => row.criticality === "Regulatory-Critical").length,
      psmCriticalEvidence: rows.filter((row) => row.criticality === "PSM-Critical").length,
      openRequests: requests.filter((row) => !["Fulfilled", "Cancelled"].includes(row.request_status)).length,
      openGaps: gaps.filter((row) => row.gap_status !== "Resolved").length,
    };
  }

  private evidencePayload(user: RequestUser, dto: Row, scoped: Row, code: string) {
    if (!dto.evidenceTitle) throw new BadRequestException("Evidence title is required.");
    if (!dto.evidenceType) throw new BadRequestException("Evidence type is required.");
    if (!dto.confidentialityLevel) throw new BadRequestException("Confidentiality level is required.");
    const sourceMode = dto.sourceMode ?? "Text evidence note";
    if (!SOURCE_MODES.includes(sourceMode)) throw new BadRequestException("Evidence source mode is invalid.");
    return {
      company_id: user.tenantId,
      ...scoped,
      evidence_code: code,
      evidence_title: dto.evidenceTitle,
      evidence_description: dto.evidenceDescription ?? null,
      evidence_type: dto.evidenceType,
      evidence_status: dto.evidenceStatus ?? "Draft",
      review_status: dto.reviewStatus ?? "Not Required",
      readiness_status: dto.readinessStatus ?? "Not Ready",
      criticality: dto.criticality ?? "Medium",
      confidentiality_level: dto.confidentialityLevel,
      evidence_owner_user_id: dto.evidenceOwnerUserId ?? null,
      reviewer_user_id: dto.reviewerUserId ?? null,
      source_mode: sourceMode,
      document_id: dto.documentId ?? null,
      storage_file_id: dto.storageFileId ?? null,
      linked_module: dto.linkedModule ?? null,
      linked_record_id: dto.linkedRecordId ?? null,
      linked_record_title: dto.linkedRecordTitle ?? null,
      text_evidence_note: dto.textEvidenceNote ?? null,
      external_reference: dto.externalReference ?? null,
      evidence_date: dto.evidenceDate ?? null,
      evidence_period_start: dto.evidencePeriodStart ?? null,
      evidence_period_end: dto.evidencePeriodEnd ?? null,
      related_standard: dto.relatedStandard ?? null,
      related_clause: dto.relatedClause ?? null,
      tags_json: dto.tags ?? null,
      access_restrictions_json: dto.accessRestrictions ?? null,
      retention_requirement: dto.retentionRequirement ?? null,
      expires_at: dto.expiresAt ?? null,
      redaction_required: Boolean(dto.redactionRequired),
      created_by: user.id,
      updated_by: user.id,
    };
  }

  private evidencePatch(user: RequestUser, dto: Row, scoped: Row) {
    const patch = this.withoutUndefined({
      site_id: scoped.site_id,
      unit_id: scoped.unit_id,
      area_id: scoped.area_id,
      equipment_id: scoped.equipment_id,
      evidence_code: dto.evidenceCode,
      evidence_title: dto.evidenceTitle,
      evidence_description: dto.evidenceDescription,
      evidence_type: dto.evidenceType,
      evidence_status: dto.evidenceStatus,
      review_status: dto.reviewStatus,
      readiness_status: dto.readinessStatus,
      criticality: dto.criticality,
      confidentiality_level: dto.confidentialityLevel,
      evidence_owner_user_id: dto.evidenceOwnerUserId,
      reviewer_user_id: dto.reviewerUserId,
      source_mode: dto.sourceMode,
      document_id: dto.documentId,
      storage_file_id: dto.storageFileId,
      linked_module: dto.linkedModule,
      linked_record_id: dto.linkedRecordId,
      linked_record_title: dto.linkedRecordTitle,
      text_evidence_note: dto.textEvidenceNote,
      external_reference: dto.externalReference,
      evidence_date: dto.evidenceDate,
      evidence_period_start: dto.evidencePeriodStart,
      evidence_period_end: dto.evidencePeriodEnd,
      related_standard: dto.relatedStandard,
      related_clause: dto.relatedClause,
      tags_json: dto.tags,
      access_restrictions_json: dto.accessRestrictions,
      retention_requirement: dto.retentionRequirement,
      expires_at: dto.expiresAt,
      redaction_required: dto.redactionRequired,
      updated_by: user.id,
      updated_at: new Date().toISOString(),
    });
    if (patch.source_mode && !SOURCE_MODES.includes(patch.source_mode)) throw new BadRequestException("Evidence source mode is invalid.");
    return patch;
  }

  private linkPayload(user: RequestUser, evidence: Row, dto: Row) {
    const linkedModule = dto.linkedModule ?? dto.sourceModule ?? evidence.linked_module;
    const linkedRecordId = dto.linkedRecordId ?? dto.sourceRecordId ?? evidence.linked_record_id;
    if (!linkedModule || !linkedRecordId) throw new BadRequestException("Evidence link requires linked module and record ID.");
    return {
      company_id: user.tenantId,
      site_id: evidence.site_id,
      evidence_id: evidence.id,
      linked_object_type: dto.linkedObjectType ?? "Audit Evidence Source",
      linked_module: linkedModule,
      linked_record_id: linkedRecordId,
      program_id: dto.programId ?? null,
      plan_id: dto.planId ?? null,
      checklist_id: dto.checklistId ?? null,
      checklist_section_id: dto.checklistSectionId ?? null,
      checklist_item_id: dto.checklistItemId ?? null,
      execution_id: dto.executionId ?? null,
      response_id: dto.responseId ?? null,
      field_finding_id: dto.fieldFindingId ?? null,
      finding_id: dto.findingId ?? null,
      capa_id: dto.capaId ?? null,
      capa_action_id: dto.capaActionId ?? null,
      action_engine_id: dto.actionEngineId ?? null,
      requirement_id: dto.requirementId ?? null,
      primary_link: Boolean(dto.primaryLink),
      link_reason: dto.linkReason ?? null,
      source_snapshot_json: dto.sourceSnapshot ?? null,
      linked_by: user.id,
    };
  }

  private requirementPayload(user: RequestUser, dto: Row, scoped: Row) {
    if (!dto.requirementTitle) throw new BadRequestException("Requirement title is required.");
    if (!dto.sourceModule || !dto.sourceRecordId) throw new BadRequestException("Requirement source module and record ID are required.");
    return {
      company_id: user.tenantId,
      ...scoped,
      requirement_title: dto.requirementTitle,
      requirement_type: dto.requirementType ?? "Manual Evidence Requirement",
      source_module: dto.sourceModule,
      source_record_id: dto.sourceRecordId,
      source_snapshot_json: dto.sourceSnapshot ?? null,
      required_evidence_type: dto.requiredEvidenceType ?? null,
      required_document_category: dto.requiredDocumentCategory ?? null,
      required_source_module: dto.requiredSourceModule ?? null,
      mandatory: dto.mandatory ?? true,
      criticality: dto.criticality ?? "Medium",
      due_date: dto.dueDate ?? null,
      owner_user_id: dto.ownerUserId ?? null,
      reviewer_user_id: dto.reviewerUserId ?? null,
      acceptance_criteria: dto.acceptanceCriteria ?? null,
      requirement_status: dto.requirementStatus ?? "Open",
      fulfilled_by_evidence_ids_json: dto.fulfilledByEvidenceIds ?? null,
      created_by: user.id,
      updated_by: user.id,
    };
  }

  private requestPayload(user: RequestUser, dto: Row, scoped: Row) {
    if (!dto.requestTitle) throw new BadRequestException("Request title is required.");
    if (!dto.sourceModule || !dto.sourceRecordId) throw new BadRequestException("Request source module and record ID are required.");
    if (!dto.dueDate) throw new BadRequestException("Request due date is required.");
    return {
      company_id: user.tenantId,
      ...scoped,
      request_title: dto.requestTitle,
      request_description: dto.requestDescription ?? null,
      source_module: dto.sourceModule,
      source_record_id: dto.sourceRecordId,
      requirement_id: dto.requirementId ?? null,
      requested_evidence_type: dto.requestedEvidenceType ?? null,
      requested_from_user_id: dto.requestedFromUserId ?? null,
      requested_from_role: dto.requestedFromRole ?? null,
      requested_from_department_id: dto.requestedFromDepartmentId ?? null,
      due_date: dto.dueDate,
      priority: dto.priority ?? "Medium",
      criticality: dto.criticality ?? "Medium",
      request_status: dto.requestStatus ?? "Draft",
      reminder_settings_json: dto.reminderSettings ?? null,
      notes: dto.notes ?? null,
      requested_by: dto.requestStatus === "Sent" ? user.id : null,
      requested_at: dto.requestStatus === "Sent" ? new Date().toISOString() : null,
    };
  }

  private async createPrimaryLinkIfPresent(user: RequestUser, evidence: Row, dto: Row, scoped: Row) {
    if (!dto.sourceModule && !dto.linkedModule && !dto.sourceRecordId && !dto.linkedRecordId) return;
    await this.db.single(this.db.from("audit_evidence_links").insert(this.linkPayload(user, evidence, { ...dto, ...this.sourceIdsFromScope(scoped), primaryLink: true })).select("id").single());
  }

  private async resolveScope(user: RequestUser, dto: Row) {
    const siteId = dto.siteId ?? dto.site_id ?? user.selectedSiteId ?? null;
    if (siteId) this.assertSite(user, String(siteId));
    return {
      site_id: siteId,
      unit_id: dto.unitId ?? dto.unit_id ?? null,
      area_id: dto.areaId ?? dto.area_id ?? null,
      equipment_id: dto.equipmentId ?? dto.equipment_id ?? null,
    };
  }

  private sourceIdsFromScope(scoped: Row) {
    return { siteId: scoped.site_id, unitId: scoped.unit_id, areaId: scoped.area_id };
  }

  private async event(user: RequestUser, evidence: Row, title: string, description: string, before: Row | null, after: Row | null, extra: Row = {}) {
    const evidenceId = extra.evidenceId ?? (evidence.evidence_code || evidence.evidence_title ? evidence.id : null);
    await this.history.write({
      tenantId: user.tenantId,
      siteId: evidence.site_id,
      unitId: evidence.unit_id,
      areaId: evidence.area_id,
      actorId: user.id,
      type: title,
      title,
      description,
      before,
      after,
      evidenceId,
      sourceRecordId: evidence.id,
      ...extra,
    });
  }

  private async custody(user: RequestUser, evidence: Row, type: string, title: string, description: string, before: Row | null, after: Row | null) {
    await this.db.single(this.db.from("audit_evidence_chain_of_custody_events").insert({
      company_id: user.tenantId,
      site_id: evidence.site_id,
      evidence_id: evidence.id,
      event_type: type,
      event_title: title,
      event_description: description,
      actor_user_id: user.id,
      before_value_json: before,
      after_value_json: after,
      reason: description,
      source_module: "Audit Evidence Collection",
      source_record_id: evidence.id,
    }).select("id").single());
  }

  private async evidence(user: RequestUser, evidenceId: string, raw = false) {
    const row = await this.safeSingle(this.db.from("audit_evidence_records").select("*").eq("company_id", user.tenantId).eq("id", evidenceId).maybeSingle());
    if (!row) throw new NotFoundException("Audit evidence was not found.");
    if (!this.canSeeEvidence(user, row)) throw new ForbiddenException("Audit evidence is restricted or outside your active scope.");
    return raw ? row : this.redactEvidence(user, row);
  }

  private async single(user: RequestUser, table: string, id: string) {
    const row = await this.safeSingle(this.db.from(table).select("*").eq("company_id", user.tenantId).eq("id", id).maybeSingle());
    if (!row) throw new NotFoundException("Audit evidence record was not found.");
    if (row.site_id && !this.canSeeSite(user, row.site_id)) throw new ForbiddenException("Record is outside your site scope.");
    return row;
  }

  private childRows(table: string, user: RequestUser, column: string, value: string, order = "created_at") {
    return this.safeRows(this.db.from(table).select("*").eq("company_id", user.tenantId).eq(column, value).order(order, { ascending: false }));
  }

  private async tableRegister(user: RequestUser, table: string, query: Row = {}, statusColumn?: string, searchColumns: string[] = []) {
    const page = Math.max(1, Number(query.page ?? 1));
    const limit = Math.min(250, Math.max(1, Number(query.limit ?? 25)));
    let request: any = this.db.from(table).select("*", { count: "exact" }).eq("company_id", user.tenantId);
    const scopedSite = query.siteId ?? user.selectedSiteId;
    if (scopedSite) request = request.eq("site_id", scopedSite);
    const idFilter = query.id ?? query.requirementId ?? query.requestId ?? query.gapId ?? query.packageId ?? query.eventId;
    if (idFilter) request = request.eq("id", idFilter);
    if (statusColumn && query.status) request = request.eq(statusColumn, query.status);
    if (query.sourceModule) request = request.eq("source_module", query.sourceModule);
    if (query.sourceRecordId) request = request.eq("source_record_id", query.sourceRecordId);
    if (query.search && searchColumns.length) {
      const search = String(query.search).replace(/[,%()]/g, " ").trim();
      if (search) request = request.or(searchColumns.map((col) => `${col}.ilike.%${search}%`).join(","));
    }
    const sort = String(query.sort ?? this.defaultSort(table));
    const [sortColumn, direction] = sort.split(".");
    const { data, count, error } = await request.order(sortColumn || "updated_at", { ascending: direction === "asc" }).range((page - 1) * limit, page * limit - 1);
    if (error) throw new BadRequestException(error.message);
    const rows = (data ?? []).filter((row: Row) => !row.site_id || this.canSeeSite(user, row.site_id));
    return { rows, total: count ?? rows.length, page, limit };
  }

  private defaultSort(table: string) {
    if (table === "audit_evidence_access_events") return "accessed_at.desc";
    if (table === "audit_evidence_history_events") return "created_at.desc";
    if (table === "audit_evidence_chain_of_custody_events") return "created_at.desc";
    return "updated_at.desc";
  }

  private applyViewFilter(rows: Row[], query: Row) {
    if (query.pendingReview) return rows.filter((row) => row.evidence_status === "Pending Review" || row.review_status === "Pending Review");
    if (query.rejected) return rows.filter((row) => row.evidence_status === "Rejected" || row.review_status === "Rejected");
    if (query.reworkRequired) return rows.filter((row) => row.evidence_status === "Rework Required" || row.review_status === "Rework Required");
    if (query.verified) return rows.filter((row) => row.evidence_status === "Verified" || row.review_status === "Verified");
    if (query.restricted) return rows.filter((row) => this.isRestricted(row));
    if (query.requirementId) return rows.filter((row) => row.requirement_id === query.requirementId);
    return rows;
  }

  private sourceScopeColumn(scope: string) {
    const map: Record<string, string> = {
      program: "program_id",
      plan: "plan_id",
      checklist: "checklist_id",
      execution: "execution_id",
      response: "response_id",
      finding: "finding_id",
      capa: "capa_id",
      capaAction: "capa_action_id",
    };
    return map[scope];
  }

  private group(rows: Row[], key: string) {
    const map = new Map<string, number>();
    for (const row of rows) map.set(String(row[key] ?? "Unassigned"), (map.get(String(row[key] ?? "Unassigned")) ?? 0) + 1);
    return [...map.entries()].map(([value, count]) => ({ key: value, label: value, count }));
  }

  private canSeeEvidence(user: RequestUser, row: Row) {
    return this.canSeeSite(user, row.site_id) && (!this.isRestricted(row) || this.canViewRestricted(user));
  }

  private redactEvidence(user: RequestUser, row: Row) {
    if (!this.isRestricted(row) || this.canViewRestricted(user)) return row;
    return {
      id: row.id,
      company_id: row.company_id,
      site_id: row.site_id,
      evidence_code: row.evidence_code,
      evidence_title: "Restricted evidence",
      evidence_status: "Restricted",
      review_status: row.review_status,
      readiness_status: "Restricted Evidence",
      criticality: row.criticality,
      confidentiality_level: row.confidentiality_level,
      restricted: true,
      updated_at: row.updated_at,
    };
  }

  private isRestricted(row: Row) {
    return RESTRICTED_LEVELS.includes(row.confidentiality_level) || row.evidence_status === "Restricted";
  }

  private canViewRestricted(user: RequestUser) {
    return user.permissions?.includes("audit.evidence.view_restricted") || user.permissions?.includes("audit.evidence.manage_restricted") || user.permissions?.includes("*");
  }

  private assertEditable(row: Row, dto: Row = {}) {
    if (LOCKED_STATUSES.includes(row.evidence_status) && !dto.reopenReason) throw new ForbiddenException("Verified, archived, removed, and superseded evidence is read-only unless controlled replacement/reopen reason is supplied.");
  }

  private assertSite(user: RequestUser, siteId: string) {
    if (!this.canSeeSite(user, siteId)) throw new ForbiddenException("Selected site is outside your audit scope.");
  }

  private canSeeSite(user: RequestUser, siteId?: string | null) {
    if (!siteId) return true;
    if (user.corporateView || user.siteIds?.includes(siteId) || user.selectedSiteId === siteId) return true;
    return !user.selectedSiteId;
  }

  private eventScope(row: Row) {
    return { id: row.evidence_id ?? row.id, site_id: row.site_id, unit_id: row.unit_id, area_id: row.area_id };
  }

  private async nextCode(user: RequestUser, siteId: string | null) {
    const count = await this.countRows(user, "audit_evidence_records", siteId);
    return `AUD-EV-${new Date().getFullYear()}-${String(count + 1).padStart(6, "0")}`;
  }

  private async nextRequirementCode(user: RequestUser, siteId: string | null) {
    const count = await this.countRows(user, "audit_evidence_requirements", siteId);
    return `AUD-EVR-${new Date().getFullYear()}-${String(count + 1).padStart(6, "0")}`;
  }

  private async nextRequestCode(user: RequestUser, siteId: string | null) {
    const count = await this.countRows(user, "audit_evidence_requests", siteId);
    return `AUD-EVQ-${new Date().getFullYear()}-${String(count + 1).padStart(6, "0")}`;
  }

  private async nextPackageCode(user: RequestUser, siteId: string | null) {
    const count = await this.countRows(user, "audit_evidence_package_foundations", siteId);
    return `AUD-EVP-${new Date().getFullYear()}-${String(count + 1).padStart(6, "0")}`;
  }

  private async countRows(user: RequestUser, table: string, siteId: string | null) {
    let query: any = this.db.from(table).select("id", { count: "exact", head: true }).eq("company_id", user.tenantId);
    if (siteId) query = query.eq("site_id", siteId);
    const { count } = await query;
    return count ?? 0;
  }

  private isOverdue(date?: string | null) {
    return Boolean(date && new Date(date).getTime() < Date.now());
  }

  private isDueSoon(date?: string | null) {
    if (!date) return false;
    const delta = new Date(date).getTime() - Date.now();
    return delta >= 0 && delta <= 1000 * 60 * 60 * 24 * 14;
  }

  private truthy(value: unknown) {
    return value === true || value === "true" || value === "1" || value === 1;
  }

  private withoutUndefined(row: Row) {
    return Object.fromEntries(Object.entries(row).filter(([, value]) => value !== undefined));
  }

  private async safeRows(query: any) {
    const { data, error } = await query;
    if (error) return [];
    return data ?? [];
  }

  private async safeSingle(query: any) {
    const { data, error } = await query;
    if (error) return null;
    return data ?? null;
  }
}
