import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { RequestUser } from "../common/decorators/current-user.decorator";
import { SupabaseService } from "../database/supabase.service";
import { auditableModules, standardOptions } from "./audit-compliance.constants";
import { AuditStandardHistoryService } from "./audit-standard-history.service";

type Row = Record<string, any>;

const STANDARD_STATUSES = ["Draft", "Active", "Pending Review", "Verified", "Superseded", "Archived"];
const MAPPING_STATUSES = ["Draft", "Mapped", "Pending Review", "Verified", "Gap", "Stale", "Archived", "Not Applicable"];
const COVERAGE_STATUSES = ["Mapped", "Partially Mapped", "Not Mapped", "Not Applicable"];
const HEALTH_STATUSES = ["Healthy", "Partial", "Gap", "Evidence Missing", "Finding Open", "CAPA Overdue", "Score Stale", "Needs Review", "Not Applicable", "Unknown"];
const GAP_TYPES = ["Missing Clause Mapping", "Missing Evidence", "Missing Finding Link", "Missing CAPA Link", "Missing Score Link", "Stale Source", "Restricted Traceability", "Manual Mapping Requires Review", "Other"];

@Injectable()
export class AuditStandardMappingService {
  constructor(
    private readonly db: SupabaseService,
    private readonly history: AuditStandardHistoryService,
  ) {}

  lookups() {
    return {
      standardOptions,
      auditableModules: auditableModules.map(([key, label]) => ({ key, label })),
      standardStatuses: STANDARD_STATUSES,
      mappingStatuses: MAPPING_STATUSES,
      coverageStatuses: COVERAGE_STATUSES,
      mappingHealthStatuses: HEALTH_STATUSES,
      gapTypes: GAP_TYPES,
      gapStatuses: ["Open", "In Progress", "Resolved", "Accepted Exception", "Closed"],
      criticalities: ["Low", "Medium", "High", "Critical", "Safety-Critical", "Regulatory-Critical", "PSM-Critical"],
      sourceObjectTypes: ["program", "plan", "checklist", "execution", "response", "evidence", "finding", "capa", "score-run", "site", "unit", "area", "module-record"],
      linkRoles: ["Source", "Checklist", "Evidence", "Finding", "CAPA", "Score", "Report", "Traceability", "Supporting Record"],
    };
  }

  async context(user: RequestUser) {
    const [sites, units, areas, users, programs, plans, executions, standards, settings] = await Promise.all([
      this.safeRows(this.db.from("Site").select("id,name,tenantId").eq("tenantId", user.tenantId).order("name")),
      this.safeRows(this.db.from("Unit").select("id,name,siteId,tenantId").eq("tenantId", user.tenantId).order("name")),
      this.safeRows(this.db.from("Area").select("id,name,siteId,unitId,tenantId").eq("tenantId", user.tenantId).order("name")),
      this.safeRows(this.db.from("User").select("id,name,email,role,department,isActive,tenantId").eq("tenantId", user.tenantId).order("name")),
      this.safeRows(this.db.from("audit_programs").select("id,program_code,program_title,site_id").eq("company_id", user.tenantId).order("program_title")),
      this.safeRows(this.db.from("audit_plans").select("id,plan_code,plan_title,program_id,site_id").eq("company_id", user.tenantId).order("plan_title")),
      this.safeRows(this.db.from("audit_executions").select("id,execution_code,execution_title,program_id,plan_id,site_id,unit_id,area_id").eq("company_id", user.tenantId).order("updated_at", { ascending: false })),
      this.standards(user, { limit: 250 }),
      this.settings(user, user.selectedSiteId ?? null),
    ]);
    return {
      sites: sites.filter((site: Row) => this.canSeeSite(user, site.id)),
      units,
      areas,
      users: users.filter((row: Row) => row.isActive !== false),
      programs: programs.filter((row: Row) => this.canSeeSite(user, row.site_id)),
      plans: plans.filter((row: Row) => this.canSeeSite(user, row.site_id)),
      executions: executions.filter((row: Row) => this.canSeeSite(user, row.site_id)),
      standards: standards.rows,
      settings,
      lookups: this.lookups(),
    };
  }

  async dashboard(user: RequestUser, query: Row = {}) {
    const register = await this.register(user, { ...query, page: 1, limit: 1000 });
    const rows = register.rows;
    const gaps = await this.gaps(user, { ...query, page: 1, limit: 1000 });
    return {
      summary: this.summary(rows, gaps.rows),
      byStandard: this.group(rows, "standard_id"),
      bySite: this.group(rows, "site_id"),
      byModule: this.group(rows, "module_key"),
      gaps: gaps.rows,
      stale: rows.filter((row: Row) => row.stale_status !== "Current"),
      recent: rows.slice(0, 12),
      pendingReview: rows.filter((row: Row) => row.mapping_status === "Pending Review" || row.ready_for_review),
      verified: rows.filter((row: Row) => row.mapping_status === "Verified"),
      archived: rows.filter((row: Row) => row.archived_at),
    };
  }

  async register(user: RequestUser, query: Row = {}) {
    const page = Math.max(1, Number(query.page ?? 1));
    const limit = Math.min(250, Math.max(1, Number(query.limit ?? 25)));
    let request: any = this.db.from("audit_standard_mappings").select("*", { count: "exact" }).eq("company_id", user.tenantId);
    if (!this.truthy(query.includeArchived)) request = request.is("archived_at", null);
    const scopedSite = query.siteId ?? user.selectedSiteId;
    if (scopedSite) {
      this.assertSite(user, String(scopedSite));
      request = request.eq("site_id", scopedSite);
    } else if (user.selectedSiteId && !user.corporateView) request = request.eq("site_id", user.selectedSiteId);
    for (const [input, column] of Object.entries({
      status: "mapping_status",
      mappingStatus: "mapping_status",
      coverageStatus: "coverage_status",
      evidenceStatus: "evidence_mapping_status",
      findingStatus: "finding_mapping_status",
      capaStatus: "capa_mapping_status",
      scoreStatus: "score_mapping_status",
      healthStatus: "mapping_health_status",
      staleStatus: "stale_status",
      standardId: "standard_id",
      clauseId: "clause_id",
      programId: "program_id",
      planId: "plan_id",
      checklistId: "checklist_id",
      executionId: "execution_id",
      findingId: "finding_id",
      capaId: "capa_id",
      evidenceId: "evidence_id",
      scoreRunId: "score_run_id",
      unitId: "unit_id",
      areaId: "area_id",
      moduleKey: "module_key",
      sourceObjectType: "source_object_type",
      sourceRecordId: "source_record_id",
    })) if (query[input]) request = request.eq(column, query[input]);
    if (query.search) {
      const search = String(query.search).replace(/[,%()]/g, " ").trim();
      if (search) request = request.or(`mapping_code.ilike.%${search}%,mapping_title.ilike.%${search}%,source_module.ilike.%${search}%,module_key.ilike.%${search}%`);
    }
    const sort = String(query.sort ?? "updated_at.desc");
    const [sortColumn, direction] = sort.split(".");
    const { data, count, error } = await request.order(sortColumn || "updated_at", { ascending: direction === "asc" }).range((page - 1) * limit, page * limit - 1);
    if (error) throw new BadRequestException(error.message);
    const rows = (data ?? []).filter((row: Row) => this.canSeeSite(user, row.site_id));
    return { rows, total: count ?? rows.length, page, limit, summary: this.summary(rows, []) };
  }

  viewFilter(user: RequestUser, filter: string, query: Row = {}) {
    const filters: Row = { ...query };
    if (filter === "stale") filters.staleStatus = "Stale";
    if (filter === "pending-review") filters.mappingStatus = "Pending Review";
    if (filter === "verified") filters.mappingStatus = "Verified";
    if (filter === "archived") filters.includeArchived = true;
    if (filter === "gaps") filters.healthStatus = "Gap";
    return this.register(user, filters);
  }

  async standards(user: RequestUser, query: Row = {}) {
    return this.paginated(user, "audit_standards", query, "standard_code.ilike,standard_name.ilike,standard_type.ilike,issuing_body.ilike", "updated_at.desc");
  }

  async standard(user: RequestUser, standardId: string) {
    const row = await this.singleById(user, "audit_standards", standardId, "Audit standard not found.");
    const clauses = await this.safeRows(this.db.from("audit_standard_clauses").select("*").eq("company_id", user.tenantId).eq("standard_id", standardId).is("archived_at", null).order("clause_code"));
    const mappings = await this.safeRows(this.db.from("audit_standard_mappings").select("*").eq("company_id", user.tenantId).eq("standard_id", standardId).is("archived_at", null).order("updated_at", { ascending: false }));
    return { standard: row, clauses: clauses.filter((item: Row) => this.canSeeSite(user, item.site_id)), mappings: mappings.filter((item: Row) => this.canSeeSite(user, item.site_id)) };
  }

  async saveStandard(user: RequestUser, dto: Row, id?: string) {
    const before = id ? await this.singleById(user, "audit_standards", id, "Audit standard not found.") : null;
    const siteId = dto.siteId ?? dto.site_id ?? before?.site_id ?? null;
    if (siteId) this.assertSite(user, String(siteId));
    const nextStatus = dto.standardStatus ?? dto.standard_status ?? before?.standard_status ?? "Draft";
    const payload = this.withoutUndefined({
      company_id: user.tenantId,
      site_id: siteId,
      standard_code: dto.standardCode ?? dto.standard_code ?? before?.standard_code,
      standard_name: dto.standardName ?? dto.standard_name ?? before?.standard_name,
      standard_type: dto.standardType ?? dto.standard_type ?? before?.standard_type ?? "Company Standard",
      jurisdiction: dto.jurisdiction ?? before?.jurisdiction ?? null,
      issuing_body: dto.issuingBody ?? dto.issuing_body ?? before?.issuing_body ?? null,
      version: dto.version ?? before?.version ?? null,
      effective_date: dto.effectiveDate ?? dto.effective_date ?? before?.effective_date ?? null,
      applicability: dto.applicability ?? before?.applicability ?? null,
      standard_status: nextStatus,
      owner_user_id: dto.ownerUserId ?? dto.owner_user_id ?? before?.owner_user_id ?? null,
      notes: dto.notes ?? before?.notes ?? null,
      regulatory_register_id: dto.regulatoryRegisterId ?? dto.regulatory_register_id ?? before?.regulatory_register_id ?? null,
      created_by: before ? before.created_by : user.id,
      updated_by: user.id,
      updated_at: new Date().toISOString(),
      archived_at: nextStatus === "Archived" ? (dto.archivedAt ?? dto.archived_at ?? before?.archived_at ?? new Date().toISOString()) : null,
      archived_by: nextStatus === "Archived" ? (dto.archivedBy ?? dto.archived_by ?? user.id) : null,
      archive_reason: nextStatus === "Archived" ? (dto.reason ?? dto.archiveReason ?? dto.archive_reason ?? before?.archive_reason ?? null) : null,
    });
    if (!payload.standard_code || !payload.standard_name) throw new BadRequestException("Standard code and name are required.");
    const after = before
      ? await this.db.single<Row>(this.db.from("audit_standards").update(payload).eq("company_id", user.tenantId).eq("id", id).select().single())
      : await this.db.single<Row>(this.db.from("audit_standards").insert(payload).select().single());
    await this.event(user, after, before ? "Audit Standard Updated" : "Audit Standard Created", "Audit standard metadata saved.", before, after);
    return this.standard(user, after.id);
  }

  async clauses(user: RequestUser, query: Row = {}) {
    return this.paginated(user, "audit_standard_clauses", query, "clause_code.ilike,clause_title.ilike,requirement_category.ilike,criticality.ilike", "updated_at.desc");
  }

  async clause(user: RequestUser, clauseId: string) {
    const clause = await this.singleById(user, "audit_standard_clauses", clauseId, "Audit clause not found.");
    const mappings = await this.safeRows(this.db.from("audit_standard_mappings").select("*").eq("company_id", user.tenantId).eq("clause_id", clauseId).is("archived_at", null).order("updated_at", { ascending: false }));
    return { clause, mappings: mappings.filter((item: Row) => this.canSeeSite(user, item.site_id)) };
  }

  async saveClause(user: RequestUser, dto: Row, id?: string) {
    const before = id ? await this.singleById(user, "audit_standard_clauses", id, "Audit clause not found.") : null;
    const standardId = dto.standardId ?? dto.standard_id ?? before?.standard_id;
    if (!standardId) throw new BadRequestException("Clause requires a standard.");
    const standard = await this.singleById(user, "audit_standards", String(standardId), "Audit standard not found.");
    const siteId = dto.siteId ?? dto.site_id ?? before?.site_id ?? standard.site_id ?? null;
    if (siteId) this.assertSite(user, String(siteId));
    const clauseArchived = dto.archivedAt || dto.archived_at || dto.reason;
    const payload = this.withoutUndefined({
      company_id: user.tenantId,
      site_id: siteId,
      standard_id: standardId,
      parent_clause_id: dto.parentClauseId ?? dto.parent_clause_id ?? before?.parent_clause_id ?? null,
      clause_code: dto.clauseCode ?? dto.clause_code ?? before?.clause_code,
      clause_title: dto.clauseTitle ?? dto.clause_title ?? before?.clause_title,
      clause_summary: dto.clauseSummary ?? dto.clause_summary ?? before?.clause_summary ?? null,
      requirement_category: dto.requirementCategory ?? dto.requirement_category ?? before?.requirement_category ?? null,
      applicability: dto.applicability ?? before?.applicability ?? null,
      mandatory: this.bool(dto.mandatory, before?.mandatory ?? true),
      evidence_expectation: dto.evidenceExpectation ?? dto.evidence_expectation ?? before?.evidence_expectation ?? null,
      audit_expectation: dto.auditExpectation ?? dto.audit_expectation ?? before?.audit_expectation ?? null,
      linked_module: dto.linkedModule ?? dto.linked_module ?? before?.linked_module ?? null,
      criticality: dto.criticality ?? before?.criticality ?? "Medium",
      verification_method_foundation: dto.verificationMethodFoundation ?? dto.verification_method_foundation ?? before?.verification_method_foundation ?? null,
      regulatory_obligation_id: dto.regulatoryObligationId ?? dto.regulatory_obligation_id ?? before?.regulatory_obligation_id ?? null,
      created_by: before ? before.created_by : user.id,
      updated_by: user.id,
      updated_at: new Date().toISOString(),
      archived_at: clauseArchived ? (dto.archivedAt ?? dto.archived_at ?? before?.archived_at ?? new Date().toISOString()) : before?.archived_at ?? null,
      archived_by: clauseArchived ? (dto.archivedBy ?? dto.archived_by ?? user.id) : before?.archived_by ?? null,
      archive_reason: clauseArchived ? (dto.reason ?? dto.archiveReason ?? dto.archive_reason ?? before?.archive_reason ?? null) : before?.archive_reason ?? null,
    });
    if (!payload.clause_code || !payload.clause_title) throw new BadRequestException("Clause code and title are required.");
    const after = before
      ? await this.db.single<Row>(this.db.from("audit_standard_clauses").update(payload).eq("company_id", user.tenantId).eq("id", id).select().single())
      : await this.db.single<Row>(this.db.from("audit_standard_clauses").insert(payload).select().single());
    await this.event(user, after, before ? "Audit Clause Updated" : "Audit Clause Created", "Audit standard clause saved.", before, after);
    return this.clause(user, after.id);
  }

  async detail(user: RequestUser, mappingId: string) {
    const mapping = await this.mapping(user, mappingId);
    const [standard, clause, links, gaps, overrides, snapshots, staleness, history, coverage] = await Promise.all([
      this.safeSingle(this.db.from("audit_standards").select("*").eq("company_id", user.tenantId).eq("id", mapping.standard_id).single()),
      mapping.clause_id ? this.safeSingle(this.db.from("audit_standard_clauses").select("*").eq("company_id", user.tenantId).eq("id", mapping.clause_id).single()) : null,
      this.childRows("audit_standard_mapping_links", user, "mapping_id", mappingId, "linked_at"),
      this.childRows("audit_standard_mapping_gaps", user, "mapping_id", mappingId, "detected_at"),
      this.childRows("audit_standard_mapping_overrides", user, "mapping_id", mappingId, "created_at"),
      this.childRows("audit_standard_traceability_snapshots", user, "mapping_id", mappingId, "generated_at"),
      this.childRows("audit_standard_mapping_staleness_events", user, "mapping_id", mappingId, "detected_at"),
      this.childRows("audit_standard_mapping_history_events", user, "mapping_id", mappingId, "created_at"),
      this.coverageForMapping(user, mapping),
    ]);
    return {
      mapping,
      standard,
      clause,
      links,
      gaps,
      overrides,
      traceabilitySnapshots: snapshots,
      latestTraceability: snapshots[0]?.traceability_json ?? this.traceabilityPayload(mapping, standard, clause, links, gaps, coverage),
      staleness,
      history,
      coverage,
      readiness: this.readiness(mapping, links, gaps, coverage),
    };
  }

  async saveMapping(user: RequestUser, dto: Row, id?: string) {
    const before = id ? await this.mapping(user, id) : null;
    const standardId = dto.standardId ?? dto.standard_id ?? before?.standard_id;
    if (!standardId) throw new BadRequestException("Mapping requires a standard.");
    const standard = await this.singleById(user, "audit_standards", String(standardId), "Audit standard not found.");
    const clauseId = dto.clauseId ?? dto.clause_id ?? before?.clause_id ?? null;
    if (clauseId) await this.singleById(user, "audit_standard_clauses", String(clauseId), "Audit clause not found.");
    const siteId = dto.siteId ?? dto.site_id ?? before?.site_id ?? standard.site_id ?? user.selectedSiteId ?? null;
    if (siteId) this.assertSite(user, String(siteId));
    const settings = await this.settings(user, siteId);
    const manual = this.bool(dto.manualMapping ?? dto.manual_mapping, before?.manual_mapping ?? false);
    const reason = dto.manualMappingReason ?? dto.manual_mapping_reason ?? before?.manual_mapping_reason ?? null;
    if (manual && settings.require_reason_for_manual_mapping && !reason) throw new BadRequestException("Manual mapping requires a reason.");
    const scoped = this.resolveSourceScope(dto, before);
    const snapshot = await this.sourceSnapshot(user, scoped.source_object_type, scoped.source_record_id, { ...scoped, site_id: siteId });
    const code = dto.mappingCode ?? dto.mapping_code ?? before?.mapping_code ?? await this.nextCode(user);
    const payload = this.withoutUndefined({
      company_id: user.tenantId,
      site_id: siteId,
      unit_id: dto.unitId ?? dto.unit_id ?? before?.unit_id ?? null,
      area_id: dto.areaId ?? dto.area_id ?? before?.area_id ?? null,
      equipment_id: dto.equipmentId ?? dto.equipment_id ?? before?.equipment_id ?? null,
      standard_id: standardId,
      clause_id: clauseId,
      mapping_code: code,
      mapping_title: dto.mappingTitle ?? dto.mapping_title ?? before?.mapping_title ?? `${standard.standard_code} mapping`,
      mapping_status: dto.mappingStatus ?? dto.mapping_status ?? before?.mapping_status ?? "Draft",
      source_object_type: scoped.source_object_type,
      source_module: dto.sourceModule ?? dto.source_module ?? before?.source_module ?? this.title(scoped.source_object_type ?? "mapping"),
      source_record_id: scoped.source_record_id,
      source_snapshot_json: snapshot,
      program_id: dto.programId ?? dto.program_id ?? before?.program_id ?? scoped.program_id ?? null,
      plan_id: dto.planId ?? dto.plan_id ?? before?.plan_id ?? scoped.plan_id ?? null,
      checklist_id: dto.checklistId ?? dto.checklist_id ?? before?.checklist_id ?? scoped.checklist_id ?? null,
      checklist_section_id: dto.checklistSectionId ?? dto.checklist_section_id ?? before?.checklist_section_id ?? null,
      checklist_item_id: dto.checklistItemId ?? dto.checklist_item_id ?? before?.checklist_item_id ?? null,
      execution_id: dto.executionId ?? dto.execution_id ?? before?.execution_id ?? scoped.execution_id ?? null,
      response_id: dto.responseId ?? dto.response_id ?? before?.response_id ?? null,
      evidence_id: dto.evidenceId ?? dto.evidence_id ?? before?.evidence_id ?? null,
      finding_id: dto.findingId ?? dto.finding_id ?? before?.finding_id ?? null,
      capa_id: dto.capaId ?? dto.capa_id ?? before?.capa_id ?? null,
      score_run_id: dto.scoreRunId ?? dto.score_run_id ?? before?.score_run_id ?? null,
      module_key: dto.moduleKey ?? dto.module_key ?? before?.module_key ?? null,
      module_record_id: dto.moduleRecordId ?? dto.module_record_id ?? before?.module_record_id ?? null,
      primary_mapping: this.bool(dto.primaryMapping ?? dto.primary_mapping, before?.primary_mapping ?? false),
      manual_mapping: manual,
      manual_mapping_reason: reason,
      applicability_statement: dto.applicabilityStatement ?? dto.applicability_statement ?? before?.applicability_statement ?? null,
      exclusions: dto.exclusions ?? before?.exclusions ?? null,
      applicability_justification: dto.applicabilityJustification ?? dto.applicability_justification ?? before?.applicability_justification ?? null,
      ready_for_review: this.bool(dto.readyForReview ?? dto.ready_for_review, before?.ready_for_review ?? false),
      ready_for_report: this.bool(dto.readyForReport ?? dto.ready_for_report, before?.ready_for_report ?? false),
      created_by: before ? before.created_by : user.id,
      updated_by: user.id,
      updated_at: new Date().toISOString(),
    });
    if (settings.require_clause_for_mapping && !payload.clause_id) throw new BadRequestException("Mapping requires a standard clause.");
    if (settings.require_source_object_for_mapping && !payload.source_record_id) throw new BadRequestException("Mapping requires a source audit object.");
    const withHealth = await this.decorateStatuses(user, payload);
    const after = before
      ? await this.db.single<Row>(this.db.from("audit_standard_mappings").update(withHealth).eq("company_id", user.tenantId).eq("id", id).select().single())
      : await this.db.single<Row>(this.db.from("audit_standard_mappings").insert(withHealth).select().single());
    await this.event(user, after, before ? "Standards Mapping Updated" : "Standards Mapping Created", "Regulatory/standard mapping saved.", before, after);
    await this.recalculate(user, after.id);
    return this.detail(user, after.id);
  }

  async link(user: RequestUser, mappingId: string, dto: Row) {
    const mapping = await this.mapping(user, mappingId);
    const linkedRecordId = dto.linkedRecordId ?? dto.linked_record_id;
    if (!linkedRecordId) throw new BadRequestException("Linked record id is required.");
    const link = await this.db.single<Row>(this.db.from("audit_standard_mapping_links").insert({
      company_id: user.tenantId,
      site_id: mapping.site_id,
      mapping_id: mappingId,
      linked_object_type: dto.linkedObjectType ?? dto.linked_object_type ?? dto.linkRole ?? "record",
      linked_module: dto.linkedModule ?? dto.linked_module ?? mapping.module_key ?? null,
      linked_record_id: linkedRecordId,
      link_role: dto.linkRole ?? dto.link_role ?? "Traceability",
      link_status: "Active",
      source_snapshot_json: await this.sourceSnapshot(user, dto.linkedObjectType ?? dto.linked_object_type, linkedRecordId, mapping),
      linked_by: user.id,
    }).select().single());
    await this.event(user, mapping, "Mapping Link Added", "Linked source, evidence, finding, CAPA, score, or module record to mapped clause.", null, link);
    await this.recalculate(user, mappingId);
    return this.detail(user, mappingId);
  }

  async unlink(user: RequestUser, mappingId: string, linkId: string, dto: Row = {}) {
    const mapping = await this.mapping(user, mappingId);
    const before = await this.singleById(user, "audit_standard_mapping_links", linkId, "Mapping link not found.");
    const after = await this.db.single<Row>(this.db.from("audit_standard_mapping_links").update({ link_status: "Removed", removed_by: user.id, removed_at: new Date().toISOString(), remove_reason: dto.reason ?? null }).eq("company_id", user.tenantId).eq("id", linkId).select().single());
    await this.event(user, mapping, "Mapping Link Removed", dto.reason ?? "Mapping link removed.", before, after);
    await this.recalculate(user, mappingId);
    return this.detail(user, mappingId);
  }

  async recalculate(user: RequestUser, mappingId?: string): Promise<Row> {
    if (mappingId) {
      const mapping = await this.mapping(user, mappingId);
      const updated = await this.decorateStatuses(user, mapping);
      const after = await this.db.single<Row>(this.db.from("audit_standard_mappings").update({
        coverage_status: updated.coverage_status,
        evidence_mapping_status: updated.evidence_mapping_status,
        finding_mapping_status: updated.finding_mapping_status,
        capa_mapping_status: updated.capa_mapping_status,
        score_mapping_status: updated.score_mapping_status,
        mapping_health_status: updated.mapping_health_status,
        ready_for_report: updated.ready_for_report,
        updated_at: new Date().toISOString(),
      }).eq("company_id", user.tenantId).eq("id", mappingId).select().single());
      const coverage = await this.coverageForMapping(user, after);
      await this.upsertCoverage(user, after, coverage);
      await this.detectGapsForMapping(user, after, coverage);
      await this.event(user, after, "Mapping Coverage Recalculated", "Coverage health regenerated from backend mappings, evidence, findings, CAPA, and score records.", mapping, after);
      return this.detail(user, mappingId);
    }
    const all = await this.register(user, { page: 1, limit: 1000 });
    const results = [];
    for (const row of all.rows) results.push(await this.recalculate(user, row.id));
    return { recalculated: results.length, results };
  }

  async transition(user: RequestUser, mappingId: string, action: string, dto: Row = {}) {
    const before = await this.mapping(user, mappingId);
    const now = new Date().toISOString();
    const patch: Row = { updated_at: now, updated_by: user.id };
    let title = "Mapping Updated";
    if (action === "verify") {
      const readiness = this.readiness(before, await this.childRows("audit_standard_mapping_links", user, "mapping_id", mappingId, "linked_at"), await this.childRows("audit_standard_mapping_gaps", user, "mapping_id", mappingId, "detected_at"), await this.coverageForMapping(user, before));
      if (readiness.blockers.length) throw new BadRequestException(`Cannot verify mapping: ${readiness.blockers.map((item: Row) => item.title).join(", ")}`);
      patch.mapping_status = "Verified"; patch.verified_by = user.id; patch.verified_at = now; title = "Standards Mapping Verified";
    } else if (action === "mark-stale") {
      patch.stale_status = "Stale"; patch.stale_reason = dto.reason ?? "Source mapping changed."; patch.mapping_status = "Stale"; title = "Standards Mapping Marked Stale";
      await this.db.single(this.db.from("audit_standard_mapping_staleness_events").insert({ company_id: user.tenantId, site_id: before.site_id, mapping_id: mappingId, stale_trigger_type: dto.triggerType ?? "Manual", source_module: dto.sourceModule ?? before.source_module, source_record_id: dto.sourceRecordId ?? before.source_record_id, stale_reason: patch.stale_reason }).select("id").single());
    } else if (action === "archive") {
      if (!dto.reason) throw new BadRequestException("Archive requires reason.");
      patch.mapping_status = "Archived"; patch.archived_by = user.id; patch.archived_at = now; patch.archive_reason = dto.reason; title = "Standards Mapping Archived";
    } else if (action === "reopen") {
      if (!dto.reason) throw new BadRequestException("Reopen requires reason.");
      patch.mapping_status = "Pending Review"; patch.archived_at = null; patch.archived_by = null; patch.archive_reason = null; title = "Standards Mapping Reopened";
    } else throw new BadRequestException("Unsupported mapping transition.");
    const after = await this.db.single<Row>(this.db.from("audit_standard_mappings").update(patch).eq("company_id", user.tenantId).eq("id", mappingId).select().single());
    await this.event(user, after, title, dto.reason ?? title, before, after);
    return this.detail(user, mappingId);
  }

  async coverageMatrix(user: RequestUser, query: Row = {}) {
    const mappings = await this.register(user, { ...query, page: 1, limit: 1000 });
    const standards = await this.standards(user, { ...query, page: 1, limit: 1000 });
    const clauses = await this.clauses(user, { ...query, page: 1, limit: 1000 });
    const rows = clauses.rows.map((clause: Row) => {
      const linked = mappings.rows.filter((mapping: Row) => mapping.clause_id === clause.id);
      return {
        standardId: clause.standard_id,
        clauseId: clause.id,
        clauseCode: clause.clause_code,
        clauseTitle: clause.clause_title,
        criticality: clause.criticality,
        coverageStatus: linked.length ? (linked.some((mapping: Row) => mapping.coverage_status === "Mapped") ? "Mapped" : "Partially Mapped") : "Not Mapped",
        evidenceStatus: linked.some((mapping: Row) => mapping.evidence_mapping_status === "Mapped") ? "Mapped" : "Missing",
        openGaps: linked.filter((mapping: Row) => mapping.mapping_health_status === "Gap" || mapping.mapping_health_status === "Evidence Missing").length,
        mappings: linked,
      };
    });
    return { rows, standards: standards.rows, summary: this.coverageSummary(rows) };
  }

  async gaps(user: RequestUser, query: Row = {}) {
    return this.paginated(user, "audit_standard_mapping_gaps", query, "gap_title.ilike,gap_description.ilike,gap_type.ilike,gap_severity.ilike", "detected_at.desc");
  }

  async createGap(user: RequestUser, dto: Row) {
    const siteId = dto.siteId ?? dto.site_id ?? user.selectedSiteId ?? null;
    if (siteId) this.assertSite(user, String(siteId));
    const payload = this.withoutUndefined({
      company_id: user.tenantId,
      site_id: siteId,
      unit_id: dto.unitId ?? dto.unit_id ?? null,
      area_id: dto.areaId ?? dto.area_id ?? null,
      standard_id: dto.standardId ?? dto.standard_id ?? null,
      clause_id: dto.clauseId ?? dto.clause_id ?? null,
      mapping_id: dto.mappingId ?? dto.mapping_id ?? null,
      source_module: dto.sourceModule ?? dto.source_module ?? null,
      source_record_id: dto.sourceRecordId ?? dto.source_record_id ?? null,
      gap_type: dto.gapType ?? dto.gap_type ?? "Other",
      gap_title: dto.gapTitle ?? dto.gap_title,
      gap_description: dto.gapDescription ?? dto.gap_description ?? null,
      gap_status: dto.gapStatus ?? dto.gap_status ?? "Open",
      gap_severity: dto.gapSeverity ?? dto.gap_severity ?? "Medium",
      criticality: dto.criticality ?? null,
      owner_user_id: dto.ownerUserId ?? dto.owner_user_id ?? null,
      due_date: dto.dueDate ?? dto.due_date ?? null,
      recommended_fix: dto.recommendedFix ?? dto.recommended_fix ?? null,
      created_by: user.id,
    });
    if (!payload.gap_title) throw new BadRequestException("Gap title is required.");
    const gap = await this.db.single<Row>(this.db.from("audit_standard_mapping_gaps").insert(payload).select().single());
    await this.event(user, gap, "Mapping Gap Created", "Standards mapping gap recorded.", null, gap);
    return gap;
  }

  async resolveGap(user: RequestUser, gapId: string, dto: Row = {}) {
    const before = await this.singleById(user, "audit_standard_mapping_gaps", gapId, "Mapping gap not found.");
    if (!dto.reason && !dto.resolutionNote) throw new BadRequestException("Gap resolution requires a note.");
    const after = await this.db.single<Row>(this.db.from("audit_standard_mapping_gaps").update({ gap_status: dto.status ?? "Resolved", resolved_by: user.id, resolved_at: new Date().toISOString(), resolution_note: dto.resolutionNote ?? dto.reason, updated_at: new Date().toISOString() }).eq("company_id", user.tenantId).eq("id", gapId).select().single());
    await this.event(user, after, "Mapping Gap Resolved", dto.resolutionNote ?? dto.reason, before, after);
    return after;
  }

  async createOverride(user: RequestUser, mappingId: string, dto: Row) {
    const mapping = await this.mapping(user, mappingId);
    if (!dto.overrideReason && !dto.reason) throw new BadRequestException("Override requires reason.");
    const settings = await this.settings(user, mapping.site_id);
    if (!settings.allow_mapping_override) throw new ForbiddenException("Mapping override is disabled by company/site policy.");
    const override = await this.db.single<Row>(this.db.from("audit_standard_mapping_overrides").insert({
      company_id: user.tenantId,
      site_id: mapping.site_id,
      mapping_id: mappingId,
      override_type: dto.overrideType ?? dto.override_type ?? "Manual Mapping Override",
      override_value_json: dto.overrideValue ?? dto.override_value_json ?? {},
      override_reason: dto.overrideReason ?? dto.reason,
      risk_compliance_justification: dto.riskComplianceJustification ?? dto.risk_compliance_justification ?? null,
      approval_required: settings.require_approval_for_mapping_override,
      override_status: settings.require_approval_for_mapping_override ? "Pending Approval" : "Approved",
      created_by: user.id,
    }).select().single());
    await this.event(user, mapping, "Mapping Override Created", override.override_reason, null, override);
    return this.detail(user, mappingId);
  }

  async overrideTransition(user: RequestUser, mappingId: string, overrideId: string, action: string, dto: Row = {}) {
    const mapping = await this.mapping(user, mappingId);
    const before = await this.singleById(user, "audit_standard_mapping_overrides", overrideId, "Mapping override not found.");
    const patch: Row = {};
    if (action === "approve") { patch.override_status = "Approved"; patch.approved_by = user.id; patch.approved_at = new Date().toISOString(); }
    else if (action === "reject") { patch.override_status = "Rejected"; patch.rejected_by = user.id; patch.rejected_at = new Date().toISOString(); patch.rejection_reason = dto.reason ?? null; }
    else if (action === "remove") { patch.override_status = "Removed"; patch.removed_by = user.id; patch.removed_at = new Date().toISOString(); patch.remove_reason = dto.reason ?? null; }
    else throw new BadRequestException("Unsupported override transition.");
    const after = await this.db.single<Row>(this.db.from("audit_standard_mapping_overrides").update(patch).eq("company_id", user.tenantId).eq("id", overrideId).select().single());
    await this.event(user, mapping, `Mapping Override ${this.title(action)}`, dto.reason ?? `Override ${action}`, before, after);
    return this.detail(user, mappingId);
  }

  async traceability(user: RequestUser, query: Row = {}) {
    const mappings = await this.register(user, { ...query, page: 1, limit: 250 });
    return { rows: await Promise.all(mappings.rows.map(async (mapping: Row) => (await this.detail(user, mapping.id)).latestTraceability)), summary: mappings.summary };
  }

  async snapshotTraceability(user: RequestUser, mappingId: string) {
    const detail = await this.detail(user, mappingId);
    const snapshot = await this.db.single<Row>(this.db.from("audit_standard_traceability_snapshots").insert({
      company_id: user.tenantId,
      site_id: detail.mapping.site_id,
      mapping_id: mappingId,
      standard_id: detail.mapping.standard_id,
      clause_id: detail.mapping.clause_id,
      traceability_json: detail.latestTraceability,
      restricted_links_count: Number(detail.latestTraceability.restrictedLinksCount ?? 0),
      missing_links_count: Number(detail.latestTraceability.missingLinksCount ?? 0),
      snapshot_status: "Generated",
      generated_by: user.id,
    }).select().single());
    await this.event(user, detail.mapping, "Traceability Snapshot Generated", "Immutable clause-to-evidence traceability snapshot generated.", null, snapshot);
    return this.detail(user, mappingId);
  }

  async settings(user: RequestUser, siteId?: string | null) {
    if (siteId) this.assertSite(user, siteId);
    const request = this.db.from("audit_standard_mapping_settings").select("*").eq("company_id", user.tenantId);
    const row = await this.safeSingle((siteId ? request.eq("site_id", siteId) : request.is("site_id", null)).maybeSingle());
    if (row) return row;
    return {
      company_id: user.tenantId,
      site_id: siteId ?? null,
      require_clause_for_mapping: true,
      require_source_object_for_mapping: true,
      require_scope_for_mapping: true,
      require_evidence_for_verified_mapping: true,
      require_score_for_report_ready: false,
      allow_manual_mapping: true,
      require_reason_for_manual_mapping: true,
      allow_mapping_override: true,
      require_approval_for_mapping_override: true,
      auto_create_gap_for_missing_mapping: true,
      auto_create_gap_for_missing_evidence: true,
      auto_mark_stale_on_source_change: true,
      settings_json: {},
    };
  }

  async updateSettings(user: RequestUser, dto: Row) {
    const siteId = dto.siteId ?? dto.site_id ?? null;
    if (siteId) this.assertSite(user, String(siteId));
    const before = await this.settings(user, siteId);
    const payload = this.withoutUndefined({
      company_id: user.tenantId,
      site_id: siteId,
      require_clause_for_mapping: this.bool(dto.requireClauseForMapping ?? dto.require_clause_for_mapping, before.require_clause_for_mapping),
      require_source_object_for_mapping: this.bool(dto.requireSourceObjectForMapping ?? dto.require_source_object_for_mapping, before.require_source_object_for_mapping),
      require_scope_for_mapping: this.bool(dto.requireScopeForMapping ?? dto.require_scope_for_mapping, before.require_scope_for_mapping),
      require_evidence_for_verified_mapping: this.bool(dto.requireEvidenceForVerifiedMapping ?? dto.require_evidence_for_verified_mapping, before.require_evidence_for_verified_mapping),
      require_score_for_report_ready: this.bool(dto.requireScoreForReportReady ?? dto.require_score_for_report_ready, before.require_score_for_report_ready),
      allow_manual_mapping: this.bool(dto.allowManualMapping ?? dto.allow_manual_mapping, before.allow_manual_mapping),
      require_reason_for_manual_mapping: this.bool(dto.requireReasonForManualMapping ?? dto.require_reason_for_manual_mapping, before.require_reason_for_manual_mapping),
      allow_mapping_override: this.bool(dto.allowMappingOverride ?? dto.allow_mapping_override, before.allow_mapping_override),
      require_approval_for_mapping_override: this.bool(dto.requireApprovalForMappingOverride ?? dto.require_approval_for_mapping_override, before.require_approval_for_mapping_override),
      auto_create_gap_for_missing_mapping: this.bool(dto.autoCreateGapForMissingMapping ?? dto.auto_create_gap_for_missing_mapping, before.auto_create_gap_for_missing_mapping),
      auto_create_gap_for_missing_evidence: this.bool(dto.autoCreateGapForMissingEvidence ?? dto.auto_create_gap_for_missing_evidence, before.auto_create_gap_for_missing_evidence),
      auto_mark_stale_on_source_change: this.bool(dto.autoMarkStaleOnSourceChange ?? dto.auto_mark_stale_on_source_change, before.auto_mark_stale_on_source_change),
      settings_json: dto.settingsJson ?? dto.settings_json ?? before.settings_json ?? {},
      updated_by: user.id,
      updated_at: new Date().toISOString(),
    });
    const existingRequest = this.db.from("audit_standard_mapping_settings").select("id").eq("company_id", user.tenantId);
    const existing = await this.safeSingle((siteId ? existingRequest.eq("site_id", String(siteId)) : existingRequest.is("site_id", null)).maybeSingle());
    const after = existing?.id
      ? await this.db.single<Row>(this.db.from("audit_standard_mapping_settings").update(payload).eq("company_id", user.tenantId).eq("id", existing.id).select().single())
      : await this.db.single<Row>(this.db.from("audit_standard_mapping_settings").insert(payload).select().single());
    await this.event(user, after, "Standards Mapping Settings Updated", "Standards mapping settings changed.", before, after);
    return after;
  }

  async historyEvents(user: RequestUser, query: Row = {}) {
    return this.paginated(user, "audit_standard_mapping_history_events", query, "event_title.ilike,event_description.ilike,event_type.ilike", "created_at.desc");
  }

  async sourceMappings(user: RequestUser, sourceObjectType: string, sourceRecordId: string, query: Row = {}) {
    return this.register(user, { ...query, sourceObjectType, sourceRecordId });
  }

  private async decorateStatuses(user: RequestUser, payload: Row) {
    const coverage = await this.coverageForMapping(user, payload);
    return {
      ...payload,
      coverage_status: coverage.coverageStatus,
      evidence_mapping_status: coverage.evidenceStatus,
      finding_mapping_status: coverage.findingStatus,
      capa_mapping_status: coverage.capaStatus,
      score_mapping_status: coverage.scoreStatus,
      mapping_health_status: coverage.healthStatus,
      ready_for_report: coverage.readyForReport,
    };
  }

  private async coverageForMapping(user: RequestUser, mapping: Row) {
    const links = mapping.id ? await this.childRows("audit_standard_mapping_links", user, "mapping_id", mapping.id, "linked_at") : [];
    const evidenceIds = this.unique([mapping.evidence_id, ...links.filter((row: Row) => row.link_role === "Evidence" || row.linked_object_type === "evidence").map((row: Row) => row.linked_record_id)]);
    const findingIds = this.unique([mapping.finding_id, ...links.filter((row: Row) => row.link_role === "Finding" || row.linked_object_type === "finding").map((row: Row) => row.linked_record_id)]);
    const capaIds = this.unique([mapping.capa_id, ...links.filter((row: Row) => row.link_role === "CAPA" || row.linked_object_type === "capa").map((row: Row) => row.linked_record_id)]);
    const scoreRunIds = this.unique([mapping.score_run_id, ...links.filter((row: Row) => row.link_role === "Score" || row.linked_object_type === "score-run").map((row: Row) => row.linked_record_id)]);
    const [findings, capas, scores] = await Promise.all([
      this.rowsByIds(user, "audit_findings", findingIds),
      this.rowsByIds(user, "audit_capa_packages", capaIds),
      this.rowsByIds(user, "audit_score_runs", scoreRunIds),
    ]);
    const openFindings = findings.filter((row: Row) => !["Closed", "Resolved", "Rejected", "Archived"].includes(row.finding_status ?? row.status ?? ""));
    const overdueCapas = capas.filter((row: Row) => (row.due_date || row.target_due_date) && new Date(row.due_date ?? row.target_due_date).getTime() < Date.now() && !["Closed", "Verified", "Archived"].includes(row.capa_status ?? row.status ?? ""));
    const staleScores = scores.filter((row: Row) => row.stale_status && row.stale_status !== "Current");
    const hasDirectSource = Boolean(mapping.source_record_id || mapping.program_id || mapping.plan_id || mapping.checklist_id || mapping.execution_id || mapping.module_record_id);
    const coverageStatus = mapping.mapping_status === "Not Applicable" ? "Not Applicable" : hasDirectSource || links.length ? "Mapped" : "Not Mapped";
    const evidenceStatus = evidenceIds.length ? "Mapped" : "Missing";
    const findingStatus = openFindings.length ? "Open Findings" : findings.length ? "Findings Closed" : "No Findings";
    const capaStatus = overdueCapas.length ? "Overdue CAPA" : capas.length ? "CAPA Linked" : openFindings.length ? "Required" : "Not Required";
    const scoreStatus = staleScores.length ? "Stale Score" : scores.length ? "Scored" : "Not Scored";
    let healthStatus = "Healthy";
    if (coverageStatus === "Not Applicable") healthStatus = "Not Applicable";
    else if (coverageStatus === "Not Mapped") healthStatus = "Gap";
    else if (!evidenceIds.length) healthStatus = "Evidence Missing";
    else if (openFindings.length) healthStatus = "Finding Open";
    else if (overdueCapas.length) healthStatus = "CAPA Overdue";
    else if (staleScores.length) healthStatus = "Score Stale";
    else if (mapping.manual_mapping && !mapping.verified_at) healthStatus = "Needs Review";
    return {
      coverageStatus,
      evidenceStatus,
      findingStatus,
      capaStatus,
      scoreStatus,
      healthStatus,
      evidenceCount: evidenceIds.length,
      findingCount: findings.length,
      openFindingCount: openFindings.length,
      capaCount: capas.length,
      overdueCapaCount: overdueCapas.length,
      latestScore: scores[0]?.final_score ?? null,
      latestScoreRunId: scores[0]?.id ?? null,
      readyForReport: coverageStatus === "Mapped" && evidenceIds.length > 0 && !openFindings.length && !overdueCapas.length && !staleScores.length,
    };
  }

  private async upsertCoverage(user: RequestUser, mapping: Row, coverage: Row) {
    let existingRequest: any = this.db.from("audit_standard_coverage_records").select("id").eq("company_id", user.tenantId).eq("standard_id", mapping.standard_id);
    existingRequest = mapping.clause_id ? existingRequest.eq("clause_id", mapping.clause_id) : existingRequest.is("clause_id", null);
    existingRequest = mapping.site_id ? existingRequest.eq("site_id", mapping.site_id) : existingRequest.is("site_id", null);
    const existing = await this.safeSingle(existingRequest.maybeSingle());
    const payload = {
      company_id: user.tenantId,
      site_id: mapping.site_id ?? null,
      unit_id: mapping.unit_id ?? null,
      area_id: mapping.area_id ?? null,
      standard_id: mapping.standard_id,
      clause_id: mapping.clause_id,
      program_id: mapping.program_id ?? null,
      plan_id: mapping.plan_id ?? null,
      checklist_id: mapping.checklist_id ?? null,
      execution_id: mapping.execution_id ?? null,
      module_key: mapping.module_key ?? null,
      coverage_scope: mapping.site_id ? "Site" : "Company",
      coverage_status: coverage.coverageStatus,
      evidence_status: coverage.evidenceStatus,
      finding_status: coverage.findingStatus,
      capa_status: coverage.capaStatus,
      score_status: coverage.scoreStatus,
      mapping_health_status: coverage.healthStatus,
      coverage_percent: coverage.coverageStatus === "Mapped" ? 100 : coverage.coverageStatus === "Partially Mapped" ? 50 : 0,
      evidence_count: coverage.evidenceCount,
      finding_count: coverage.findingCount,
      open_finding_count: coverage.openFindingCount,
      capa_count: coverage.capaCount,
      overdue_capa_count: coverage.overdueCapaCount,
      latest_score: coverage.latestScore,
      latest_score_run_id: coverage.latestScoreRunId,
      result_json: coverage,
      calculated_by: user.id,
      calculated_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    return existing?.id
      ? this.db.single(this.db.from("audit_standard_coverage_records").update(payload).eq("id", existing.id).select("id").single())
      : this.db.single(this.db.from("audit_standard_coverage_records").insert(payload).select("id").single());
  }

  private async detectGapsForMapping(user: RequestUser, mapping: Row, coverage: Row) {
    const settings = await this.settings(user, mapping.site_id);
    if (coverage.coverageStatus === "Not Mapped" && settings.auto_create_gap_for_missing_mapping) await this.ensureGap(user, mapping, "Missing Clause Mapping", "No audit object is mapped to this standard clause.");
    if (coverage.evidenceStatus === "Missing" && settings.auto_create_gap_for_missing_evidence) await this.ensureGap(user, mapping, "Missing Evidence", "Mapped clause has no evidence link.");
  }

  private async ensureGap(user: RequestUser, mapping: Row, gapType: string, description: string) {
    const existing = await this.safeSingle(this.db.from("audit_standard_mapping_gaps").select("id").eq("company_id", user.tenantId).eq("mapping_id", mapping.id).eq("gap_type", gapType).neq("gap_status", "Resolved").maybeSingle());
    if (existing) return existing;
    return this.createGap(user, { site_id: mapping.site_id, unit_id: mapping.unit_id, area_id: mapping.area_id, standard_id: mapping.standard_id, clause_id: mapping.clause_id, mapping_id: mapping.id, gap_type: gapType, gap_title: gapType, gap_description: description, gap_severity: mapping.mapping_health_status === "Gap" ? "High" : "Medium" });
  }

  private readiness(mapping: Row, links: Row[], gaps: Row[], coverage: Row) {
    const blockers = [
      ...(!mapping.standard_id ? [{ title: "Missing standard", reason: "A standard must be selected." }] : []),
      ...(!mapping.clause_id ? [{ title: "Missing clause", reason: "A clause must be selected." }] : []),
      ...(!mapping.source_record_id && !links.length ? [{ title: "Missing source object", reason: "Map the clause to an audit object or linked record." }] : []),
      ...(coverage.evidenceStatus === "Missing" ? [{ title: "Missing evidence", reason: "Evidence is required before verification/report readiness." }] : []),
      ...(gaps.filter((gap: Row) => !["Resolved", "Closed", "Accepted Exception"].includes(gap.gap_status)).map((gap: Row) => ({ title: gap.gap_title, reason: gap.gap_description ?? gap.gap_type }))),
      ...(mapping.stale_status !== "Current" ? [{ title: "Mapping stale", reason: mapping.stale_reason ?? "Mapped source changed." }] : []),
    ];
    return {
      status: blockers.length ? "Blocked" : mapping.mapping_status === "Verified" ? "Complete" : "Ready",
      blockers,
      warnings: [
        ...(mapping.manual_mapping ? [{ title: "Manual mapping", reason: mapping.manual_mapping_reason ?? "Manual mapping should be reviewed." }] : []),
        ...(coverage.scoreStatus === "Not Scored" ? [{ title: "No score link", reason: "No compliance score run is linked yet." }] : []),
      ],
      readyToVerify: !blockers.length,
      readyForReport: coverage.readyForReport && !blockers.length,
    };
  }

  private traceabilityPayload(mapping: Row, standard: Row | null, clause: Row | null, links: Row[], gaps: Row[], coverage: Row) {
    const chain = [
      { type: "standard", id: standard?.id, label: standard?.standard_code, title: standard?.standard_name },
      { type: "clause", id: clause?.id, label: clause?.clause_code, title: clause?.clause_title },
      { type: mapping.source_object_type, id: mapping.source_record_id, label: mapping.source_module, title: mapping.mapping_title },
      ...links.filter((link: Row) => link.link_status === "Active").map((link: Row) => ({ type: link.linked_object_type, id: link.linked_record_id, label: link.link_role, title: link.linked_module })),
    ].filter((item) => item.id);
    return {
      mappingId: mapping.id,
      mappingCode: mapping.mapping_code,
      chain,
      coverage,
      gaps: gaps.filter((gap: Row) => !["Resolved", "Closed", "Accepted Exception"].includes(gap.gap_status)),
      restrictedLinksCount: links.filter((link: Row) => link.restricted).length,
      missingLinksCount: coverage.evidenceStatus === "Missing" ? 1 : 0,
      generatedAt: new Date().toISOString(),
    };
  }

  private async sourceSnapshot(user: RequestUser, type?: string | null, id?: string | null, scope: Row = {}) {
    if (!type || !id) return {};
    const table = this.sourceTable(type);
    if (!table) return { type, id, sourceUnavailable: true };
    const row = await this.safeSingle(this.db.from(table).select("*").eq("company_id", user.tenantId).eq("id", id).maybeSingle());
    if (!row) return { type, id, notFoundOrRestricted: true };
    if (!this.canSeeSite(user, row.site_id ?? scope.site_id)) return { type, id, restricted: true };
    return {
      type,
      id,
      site_id: row.site_id ?? scope.site_id ?? null,
      title: row.program_title ?? row.plan_title ?? row.template_title ?? row.execution_title ?? row.finding_title ?? row.capa_title ?? row.evidence_title ?? row.score_title ?? row.name ?? row.title ?? id,
      code: row.program_code ?? row.plan_code ?? row.template_code ?? row.execution_code ?? row.finding_code ?? row.capa_code ?? row.evidence_code ?? row.score_code ?? null,
      status: row.program_status ?? row.plan_status ?? row.template_status ?? row.execution_status ?? row.finding_status ?? row.capa_status ?? row.evidence_status ?? row.score_status ?? row.status ?? null,
      updated_at: row.updated_at ?? row.created_at ?? null,
    };
  }

  private sourceTable(type: string) {
    const map: Record<string, string> = {
      program: "audit_programs",
      plan: "audit_plans",
      checklist: "audit_checklist_templates",
      execution: "audit_executions",
      evidence: "audit_evidence_records",
      finding: "audit_findings",
      capa: "audit_capa_packages",
      "score-run": "audit_score_runs",
      site: "Site",
      unit: "Unit",
      area: "Area",
    };
    return map[type];
  }

  private resolveSourceScope(dto: Row, before?: Row | null) {
    const source_object_type = dto.sourceObjectType ?? dto.source_object_type ?? this.inferSourceType(dto) ?? before?.source_object_type ?? null;
    const source_record_id = dto.sourceRecordId ?? dto.source_record_id ?? dto.executionId ?? dto.execution_id ?? dto.planId ?? dto.plan_id ?? dto.programId ?? dto.program_id ?? dto.checklistId ?? dto.checklist_id ?? dto.findingId ?? dto.finding_id ?? dto.capaId ?? dto.capa_id ?? dto.evidenceId ?? dto.evidence_id ?? dto.scoreRunId ?? dto.score_run_id ?? dto.siteId ?? dto.site_id ?? before?.source_record_id ?? null;
    return this.withoutUndefined({
      source_object_type,
      source_record_id,
      program_id: dto.programId ?? dto.program_id ?? (source_object_type === "program" ? source_record_id : null),
      plan_id: dto.planId ?? dto.plan_id ?? (source_object_type === "plan" ? source_record_id : null),
      checklist_id: dto.checklistId ?? dto.checklist_id ?? (source_object_type === "checklist" ? source_record_id : null),
      execution_id: dto.executionId ?? dto.execution_id ?? (source_object_type === "execution" ? source_record_id : null),
    });
  }

  private inferSourceType(dto: Row) {
    if (dto.executionId ?? dto.execution_id) return "execution";
    if (dto.planId ?? dto.plan_id) return "plan";
    if (dto.programId ?? dto.program_id) return "program";
    if (dto.checklistId ?? dto.checklist_id) return "checklist";
    if (dto.findingId ?? dto.finding_id) return "finding";
    if (dto.capaId ?? dto.capa_id) return "capa";
    if (dto.evidenceId ?? dto.evidence_id) return "evidence";
    if (dto.scoreRunId ?? dto.score_run_id) return "score-run";
    if (dto.unitId ?? dto.unit_id) return "unit";
    if (dto.areaId ?? dto.area_id) return "area";
    if (dto.siteId ?? dto.site_id) return "site";
    return null;
  }

  private async paginated(user: RequestUser, table: string, query: Row, searchColumns: string, defaultSort: string) {
    const page = Math.max(1, Number(query.page ?? 1));
    const limit = Math.min(250, Math.max(1, Number(query.limit ?? 25)));
    let request: any = this.db.from(table).select("*", { count: "exact" }).eq("company_id", user.tenantId);
    if (!this.truthy(query.includeArchived) && ["audit_standards", "audit_standard_clauses", "audit_standard_mappings"].includes(table)) request = request.is("archived_at", null);
    const scopedSite = query.siteId ?? user.selectedSiteId;
    if (scopedSite) {
      this.assertSite(user, String(scopedSite));
      request = request.eq("site_id", scopedSite);
    } else if (user.selectedSiteId && !user.corporateView) request = request.eq("site_id", user.selectedSiteId);
    for (const [input, column] of Object.entries({ standardId: "standard_id", clauseId: "clause_id", status: `${table === "audit_standards" ? "standard" : table === "audit_standard_mapping_gaps" ? "gap" : "mapping"}_status`, siteId: "site_id", unitId: "unit_id", areaId: "area_id" })) if (query[input] && column !== "site_id") request = request.eq(column, query[input]);
    if (query.search) {
      const search = String(query.search).replace(/[,%()]/g, " ").trim();
      const or = searchColumns.split(",").map((part) => `${part}.%${search}%`).join(",");
      if (search) request = request.or(or);
    }
    const sort = String(query.sort ?? defaultSort);
    const [sortColumn, direction] = sort.split(".");
    const { data, count, error } = await request.order(sortColumn || "updated_at", { ascending: direction === "asc" }).range((page - 1) * limit, page * limit - 1);
    if (error) throw new BadRequestException(error.message);
    const rows = (data ?? []).filter((row: Row) => this.canSeeSite(user, row.site_id));
    return { rows, total: count ?? rows.length, page, limit };
  }

  private async mapping(user: RequestUser, mappingId: string) {
    return this.singleById(user, "audit_standard_mappings", mappingId, "Standards mapping not found.");
  }

  private async singleById(user: RequestUser, table: string, id: string, message: string) {
    const row = await this.safeSingle(this.db.from(table).select("*").eq("company_id", user.tenantId).eq("id", id).maybeSingle());
    if (!row) throw new NotFoundException(message);
    if (!this.canSeeSite(user, row.site_id)) throw new ForbiddenException("Record is outside your audit standards mapping site scope.");
    return row;
  }

  private async childRows(table: string, user: RequestUser, column: string, value: string, order = "created_at") {
    const rows = await this.safeRows(this.db.from(table).select("*").eq("company_id", user.tenantId).eq(column, value).order(order, { ascending: false }));
    return rows.filter((row: Row) => this.canSeeSite(user, row.site_id));
  }

  private async rowsByIds(user: RequestUser, table: string, ids: string[]) {
    if (!ids.length) return [];
    const rows = await this.safeRows(this.db.from(table).select("*").eq("company_id", user.tenantId).in("id", ids));
    return rows.filter((row: Row) => this.canSeeSite(user, row.site_id));
  }

  private async event(user: RequestUser, row: Row, title: string, description: string, before: Row | null, after: Row | null) {
    await this.history.write({
      tenantId: user.tenantId,
      actorId: user.id,
      type: title,
      title,
      description,
      siteId: row.site_id,
      unitId: row.unit_id,
      areaId: row.area_id,
      standardId: row.standard_id ?? row.id,
      clauseId: row.clause_id,
      mappingId: row.mapping_id ?? row.id,
      programId: row.program_id,
      planId: row.plan_id,
      executionId: row.execution_id,
      findingId: row.finding_id,
      capaId: row.capa_id,
      evidenceId: row.evidence_id,
      scoreRunId: row.score_run_id,
      sourceRecordId: row.source_record_id ?? row.id,
      before,
      after,
    });
  }

  private summary(rows: Row[], gaps: Row[]) {
    return {
      totalMappings: rows.length,
      verified: rows.filter((row) => row.mapping_status === "Verified").length,
      pendingReview: rows.filter((row) => row.mapping_status === "Pending Review" || row.ready_for_review).length,
      stale: rows.filter((row) => row.stale_status !== "Current").length,
      mapped: rows.filter((row) => row.coverage_status === "Mapped").length,
      notMapped: rows.filter((row) => row.coverage_status === "Not Mapped").length,
      evidenceMissing: rows.filter((row) => row.evidence_mapping_status === "Missing").length,
      findingsOpen: rows.filter((row) => row.finding_mapping_status === "Open Findings").length,
      capaOverdue: rows.filter((row) => row.capa_mapping_status === "Overdue CAPA").length,
      reportReady: rows.filter((row) => row.ready_for_report).length,
      openGaps: gaps.filter((gap) => !["Resolved", "Closed", "Accepted Exception"].includes(gap.gap_status)).length,
      health: HEALTH_STATUSES.map((status) => ({ status, count: rows.filter((row) => row.mapping_health_status === status).length })),
    };
  }

  private coverageSummary(rows: Row[]) {
    return {
      clauses: rows.length,
      mapped: rows.filter((row) => row.coverageStatus === "Mapped").length,
      partiallyMapped: rows.filter((row) => row.coverageStatus === "Partially Mapped").length,
      notMapped: rows.filter((row) => row.coverageStatus === "Not Mapped").length,
      evidenceMissing: rows.filter((row) => row.evidenceStatus === "Missing").length,
      openGaps: rows.reduce((sum, row) => sum + Number(row.openGaps ?? 0), 0),
    };
  }

  private group(rows: Row[], key: string) {
    const map = new Map<string, Row>();
    for (const row of rows) {
      const value = String(row[key] ?? "Unassigned");
      const current = map.get(value) ?? { key: value, label: value, count: 0, mapped: 0, gaps: 0 };
      current.count += 1;
      if (row.coverage_status === "Mapped") current.mapped += 1;
      if (["Gap", "Evidence Missing", "Finding Open", "CAPA Overdue"].includes(row.mapping_health_status)) current.gaps += 1;
      map.set(value, current);
    }
    return [...map.values()].map((row) => ({ ...row, coveragePercent: row.count ? Math.round((row.mapped / row.count) * 100) : 0 }));
  }

  private unique(values: Array<string | null | undefined>) {
    return [...new Set(values.filter((value): value is string => Boolean(value)))];
  }

  private bool(value: unknown, fallback: boolean) {
    if (value === undefined || value === null || value === "") return fallback;
    return value === true || value === "true" || value === "1" || value === 1 || value === "on";
  }

  private truthy(value: unknown) {
    return value === true || value === "true" || value === "1" || value === 1;
  }

  private assertSite(user: RequestUser, siteId: string) {
    if (!this.canSeeSite(user, siteId)) throw new ForbiddenException("Selected site is outside your audit standards mapping scope.");
  }

  private canSeeSite(user: RequestUser, siteId?: string | null) {
    return !siteId || user.isSuperAdmin || user.isCompanyAdmin || user.corporateView || user.siteIds?.includes(siteId) || user.selectedSiteId === siteId || !user.selectedSiteId;
  }

  private async nextCode(user: RequestUser) {
    const { count } = await this.db.from("audit_standard_mappings").select("id", { count: "exact", head: true }).eq("company_id", user.tenantId);
    return `AUD-MAP-${new Date().getFullYear()}-${String((count ?? 0) + 1).padStart(6, "0")}`;
  }

  private title(value: string) {
    return value.split(/[-_ ]/).map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ");
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
