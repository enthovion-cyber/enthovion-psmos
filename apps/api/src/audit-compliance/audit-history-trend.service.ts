import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { AuditService } from "../audit/audit.service";
import { RequestUser } from "../common/decorators/current-user.decorator";
import { JsonValue } from "../common/types/db.types";
import { SupabaseService } from "../database/supabase.service";

type Row = Record<string, any>;

const TREND_RUN_TYPES = [
  "Repeat Finding Analysis",
  "Finding Severity Trend",
  "CAPA Effectiveness Trend",
  "CAPA Overdue Trend",
  "Evidence Gap Trend",
  "Compliance Score Trend",
  "Standard / Clause Coverage Trend",
  "Module Weakness Trend",
  "Site / Unit Performance Trend",
  "Review Approval Cycle Trend",
  "Report Export Trend",
  "Audit Program Performance Trend",
  "Custom",
] as const;

const TREND_STATUSES = ["Draft", "Queued", "Calculating", "Calculated", "Failed", "Archived"] as const;
const RESULT_CATEGORIES = ["Improving", "Declining", "Stable", "Insufficient Data", "New Pattern", "Recurring Pattern", "Critical Pattern", "Systemic Weakness", "CAPA Ineffective", "Evidence Weakness", "Review Delay", "Report Delay"] as const;
const TREND_DIRECTIONS = ["Improving", "Declining", "Stable", "Volatile", "Unknown"] as const;
const CONFIDENCE_LEVELS = ["High", "Medium", "Low", "Insufficient Data"] as const;
const REPEAT_STATUSES = ["New Finding", "Potential Repeat", "Confirmed Repeat", "Recurring Issue", "Systemic Issue", "Repeat After CAPA", "Duplicate Only", "Not Repeat", "Needs Review"] as const;
const RECURRING_STATUSES = ["Open", "Under Review", "Action Foundation Created", "Closed", "Reopened", "Archived"] as const;
const OPPORTUNITY_TYPES = ["Preventive Action Opportunity", "Training Improvement", "Procedure Revision", "PTW Control Improvement", "MOC Process Improvement", "PSSR Readiness Improvement", "PSI Completeness Improvement", "MI Program Improvement", "Evidence Collection Improvement", "Audit Checklist Improvement", "Standard Mapping Improvement", "CAPA Effectiveness Improvement", "Review SLA Improvement", "Management Review Topic", "Custom"] as const;
const OPPORTUNITY_STATUSES = ["Open", "Under Review", "Action Foundation Created", "In Progress", "Closed", "Archived"] as const;

@Injectable()
export class AuditHistoryTrendService {
  constructor(
    private readonly db: SupabaseService,
    private readonly audit: AuditService,
  ) {}

  lookups() {
    return {
      trendRunTypes: TREND_RUN_TYPES,
      trendStatuses: TREND_STATUSES,
      trendResultCategories: RESULT_CATEGORIES,
      trendDirections: TREND_DIRECTIONS,
      trendConfidenceLevels: CONFIDENCE_LEVELS,
      repeatStatuses: REPEAT_STATUSES,
      recurringIssueStatuses: RECURRING_STATUSES,
      improvementOpportunityTypes: OPPORTUNITY_TYPES,
      improvementOpportunityStatuses: OPPORTUNITY_STATUSES,
    };
  }

  async dashboard(user: RequestUser, query: Row = {}) {
    const [history, findings, capa, evidenceGaps, scores, reports, runs, repeats, recurring, opportunities, approvals] = await Promise.all([
      this.unifiedEvents(user, { ...query, limit: 250 }),
      this.sourceRows(user, "audit_findings", query, "updated_at"),
      this.sourceRows(user, "audit_capa_packages", query, "updated_at"),
      this.sourceRows(user, "audit_evidence_gaps", query, "created_at"),
      this.sourceRows(user, "audit_score_runs", query, "calculated_at"),
      this.sourceRows(user, "audit_reports", query, "updated_at"),
      this.trendRuns(user, { ...query, limit: 250 }),
      this.repeatFindings(user, { ...query, limit: 250 }),
      this.recurringIssues(user, { ...query, limit: 250 }),
      this.continuousImprovement(user, { ...query, limit: 250 }),
      this.sourceRows(user, "audit_approval_packages", query, "updated_at"),
    ]);
    const completedAudits = await this.completedAudits(user, query);
    const summary = {
      totalHistoricalAuditEvents: history.total,
      completedAudits,
      auditCyclesCompared: runs.rows.filter((run: Row) => run.compare_period_start && run.compare_period_end).length,
      repeatFindings: repeats.total,
      recurringIssues: recurring.total,
      systemicFindings: recurring.rows.filter((row: Row) => row.cluster_type === "Systemic Issue" || row.cluster_status === "Systemic Issue").length,
      firstTimeFindings: findings.filter((row) => !row.repeat_finding).length,
      findingsReopened: findings.filter((row) => row.reopened_at).length,
      findingsRepeatedAfterCapa: repeats.rows.filter((row: Row) => row.repeat_status === "Repeat After CAPA").length,
      capaIneffective: capa.filter((row) => /ineffective/i.test(`${row.effectiveness_status ?? ""} ${row.effectiveness_result ?? ""}`)).length,
      capaOverdueRepeats: capa.filter((row) => this.isPast(row.overall_due_date) && !["Closed", "Verified", "Archived"].includes(String(row.capa_status ?? ""))).length,
      evidenceGapsRepeated: evidenceGaps.filter((row) => !["Closed", "Waived", "Archived"].includes(String(row.gap_status ?? ""))).length,
      standardsWithRepeatedFindings: this.uniqueCount(repeats.rows, "source_standard_id"),
      clausesWithRepeatedFindings: this.uniqueCount(repeats.rows, "source_clause_id"),
      modulesWithRepeatedFindings: this.uniqueCount(repeats.rows, "source_module"),
      unitsWithRepeatedFindings: this.uniqueCount(repeats.rows, "unit_id"),
      equipmentWithRepeatedFindings: this.uniqueCount(repeats.rows, "equipment_id"),
      decliningComplianceScores: this.scoreTrend(scores).declining,
      improvingComplianceScores: this.scoreTrend(scores).improving,
      reviewCycleSlaBreaches: approvals.filter((row) => this.isPast(row.due_date ?? row.review_due_date) && !/approved|closed|completed/i.test(String(row.package_status ?? row.review_status ?? ""))).length,
      reportsGenerated: reports.filter((row) => row.generated_at || /generated|exported|approved|locked/i.test(String(row.report_status ?? ""))).length,
      reportsStale: reports.filter((row) => row.stale_status && row.stale_status !== "Current").length,
      continuousImprovementOpportunities: opportunities.total,
      trendRunsCompleted: runs.rows.filter((row: Row) => row.trend_status === "Calculated").length,
      staleTrendRuns: runs.rows.filter((row: Row) => row.stale_status && row.stale_status !== "Current").length,
    };
    return {
      summary,
      activityTimeline: history.rows.slice(0, 20),
      repeatFindingsBySite: this.group(repeats.rows, "site_id"),
      repeatFindingsByUnit: this.group(repeats.rows, "unit_id"),
      repeatFindingsByModule: this.group(repeats.rows, "source_module"),
      repeatFindingsByStandardClause: this.group(repeats.rows, "standard_clause_key"),
      repeatFindingsByEquipment: this.group(repeats.rows, "equipment_id"),
      repeatFindingsByOwnerDepartment: this.group(repeats.rows, "owner_department_key"),
      recurrenceHeatmap: this.heatmap(repeats.rows),
      capaEffectivenessTrend: this.capaTrend(capa),
      capaOverdueTrend: this.timeBuckets(capa, "overall_due_date", (row) => this.isPast(row.overall_due_date)),
      evidenceGapTrend: this.timeBuckets(evidenceGaps, "created_at"),
      complianceScoreTrend: this.scoreTrend(scores),
      standardsCoverageTrend: this.group(repeats.rows, "source_standard_id"),
      reviewApprovalCycleTrend: this.timeBuckets(approvals, "updated_at"),
      reportExportTrend: this.timeBuckets(reports, "generated_at"),
      highRiskRecurringIssues: recurring.rows.filter((row: Row) => ["High", "Critical", "Safety-Critical", "Regulatory-Critical", "PSM-Critical"].includes(String(row.criticality ?? row.severity ?? ""))).slice(0, 12),
      continuousImprovementOpportunities: opportunities.rows.slice(0, 12),
      recentlyDetectedRepeatFindings: repeats.rows.slice(0, 12),
      recentlyClosedRecurringIssues: recurring.rows.filter((row: Row) => row.closed_at).slice(0, 12),
      trendRunHistory: runs.rows.slice(0, 12),
      filters: this.filtersFromQuery(query),
    };
  }

  async dashboardSummary(user: RequestUser, query: Row = {}) {
    return (await this.dashboard(user, query)).summary;
  }

  async unifiedEvents(user: RequestUser, query: Row = {}) {
    const page = Math.max(1, Number(query.page ?? 1));
    const limit = Math.min(250, Math.max(1, Number(query.limit ?? 50)));
    let request: any = this.db.from("audit_history_unified_events").select("*", { count: "exact" }).eq("company_id", user.tenantId);
    request = this.applyScope(request, user, query);
    request = this.applySimpleFilters(request, query, {
      sourceModule: "source_module",
      sourceObjectType: "source_object_type",
      sourceRecordId: "source_record_id",
      eventType: "event_type",
      criticality: "criticality",
      siteId: "site_id",
      unitId: "unit_id",
      areaId: "area_id",
      equipmentId: "equipment_id",
      actor: "actor_user_id",
    });
    if (query.dateFrom) request = request.gte("occurred_at", query.dateFrom);
    if (query.dateTo) request = request.lte("occurred_at", query.dateTo);
    if (query.search) {
      const search = this.search(String(query.search));
      if (search) request = request.or(`event_title.ilike.%${search}%,event_description.ilike.%${search}%,source_record_id.ilike.%${search}%`);
    }
    const { data, count, error } = await request.order("occurred_at", { ascending: false }).range((page - 1) * limit, page * limit - 1);
    if (error) throw new BadRequestException(error.message);
    return { rows: (data ?? []).map((row: Row) => this.redactSource(user, row)), total: count ?? 0, page, limit };
  }

  activity(user: RequestUser, query: Row = {}) {
    return this.unifiedEvents(user, query);
  }

  async snapshots(user: RequestUser, query: Row = {}) {
    const runs = await this.trendRuns(user, { ...query, limit: query.limit ?? 50 });
    return {
      rows: runs.rows.map((run: Row) => ({
        id: run.id,
        sourceModule: "Audit History / Trends",
        sourceRecordId: run.id,
        snapshotType: "Trend Input / Methodology Snapshot",
        title: run.trend_title,
        status: run.trend_status,
        staleStatus: run.stale_status,
        inputSnapshot: run.input_snapshot_json,
        methodologySnapshot: run.methodology_snapshot_json,
        createdAt: run.created_at,
        calculatedAt: run.calculated_at,
      })),
      total: runs.total,
      page: runs.page,
      limit: runs.limit,
    };
  }

  async dimensionHistory(user: RequestUser, dimension: string, query: Row = {}) {
    const events = await this.unifiedEvents(user, query);
    return { ...events, dimension, groups: this.group(events.rows, this.dimensionColumn(dimension)) };
  }

  async trendRuns(user: RequestUser, query: Row = {}) {
    const page = Math.max(1, Number(query.page ?? 1));
    const limit = Math.min(250, Math.max(1, Number(query.limit ?? 25)));
    let request: any = this.db.from("audit_trend_runs").select("*", { count: "exact" }).eq("company_id", user.tenantId);
    request = this.applyScope(request, user, query);
    request = this.applySimpleFilters(request, query, {
      status: "trend_status",
      trendStatus: "trend_status",
      staleStatus: "stale_status",
      readinessStatus: "readiness_status",
      trendType: "trend_type",
      siteId: "site_id",
      unitId: "unit_id",
      areaId: "area_id",
    });
    if (!this.truthy(query.includeArchived)) request = request.is("archived_at", null);
    if (query.search) {
      const search = this.search(String(query.search));
      if (search) request = request.or(`trend_code.ilike.%${search}%,trend_title.ilike.%${search}%,trend_type.ilike.%${search}%`);
    }
    const { data, count, error } = await request.order("updated_at", { ascending: false }).range((page - 1) * limit, page * limit - 1);
    if (error) throw new BadRequestException(error.message);
    return { rows: data ?? [], total: count ?? 0, page, limit };
  }

  async createTrendRun(user: RequestUser, dto: Row) {
    const trendTitle = String(dto.trendTitle ?? dto.trend_title ?? "").trim();
    const trendType = String(dto.trendType ?? dto.trend_type ?? "").trim();
    if (!trendTitle) throw new BadRequestException("Trend title is required.");
    if (!trendType) throw new BadRequestException("Trend type is required.");
    if (!TREND_RUN_TYPES.includes(trendType as any)) throw new BadRequestException("Trend type is not supported.");
    const start = this.requiredDate(dto.timePeriodStart ?? dto.time_period_start, "Time period start is required.");
    const end = this.requiredDate(dto.timePeriodEnd ?? dto.time_period_end, "Time period end is required.");
    if (new Date(start) > new Date(end)) throw new BadRequestException("Time period start must be before time period end.");
    const siteId = dto.siteId ?? dto.site_id ?? user.selectedSiteId ?? null;
    if (siteId) this.assertSite(user, String(siteId));
    const filters = this.withoutUndefined({
      siteId,
      unitId: dto.unitId ?? dto.unit_id ?? null,
      areaId: dto.areaId ?? dto.area_id ?? null,
      programId: dto.programId ?? dto.program_id ?? null,
      planId: dto.planId ?? dto.plan_id ?? null,
      standardId: dto.standardId ?? dto.standard_id ?? null,
      clauseId: dto.clauseId ?? dto.clause_id ?? null,
      moduleKey: dto.moduleKey ?? dto.module_key ?? null,
      severity: dto.severity ?? null,
      criticality: dto.criticality ?? null,
      ownerId: dto.ownerId ?? dto.owner_id ?? null,
      departmentId: dto.departmentId ?? dto.department_id ?? null,
      includeClosedRecords: this.truthy(dto.includeClosedRecords ?? dto.include_closed_records),
      includeRejectedRecords: this.truthy(dto.includeRejectedRecords ?? dto.include_rejected_records),
      includeArchivedRecords: this.truthy(dto.includeArchivedRecords ?? dto.include_archived_records),
    });
    const sourceModules = Array.isArray(dto.sourceModules ?? dto.source_modules)
      ? dto.sourceModules ?? dto.source_modules
      : ["Findings", "CAPA", "Evidence", "Scoring", "Standards", "Review", "Reports"];
    const inputSnapshot = await this.inputSnapshot(user, { ...filters, dateFrom: start, dateTo: end });
    const methodology = this.methodologySnapshot(await this.settings(user, siteId), trendType, dto.methodologySettings ?? dto.methodology_settings);
    const calculation = this.calculateTrendResults(trendType, inputSnapshot, start, end, dto.comparePeriodStart ?? dto.compare_period_start, dto.comparePeriodEnd ?? dto.compare_period_end);
    const trendCode = await this.nextTrendCode(user);
    const runPayload = this.withoutUndefined({
      company_id: user.tenantId,
      site_id: siteId,
      unit_id: filters.unitId,
      area_id: filters.areaId,
      trend_code: trendCode,
      trend_title: trendTitle,
      trend_type: trendType,
      trend_status: "Calculated",
      readiness_status: calculation.readinessStatus,
      stale_status: "Current",
      scope_json: dto.scope ?? { companyId: user.tenantId, siteId },
      source_modules_json: sourceModules,
      time_period_start: start,
      time_period_end: end,
      compare_period_start: dto.comparePeriodStart ?? dto.compare_period_start ?? null,
      compare_period_end: dto.comparePeriodEnd ?? dto.compare_period_end ?? null,
      filters_json: filters,
      methodology_snapshot_json: methodology,
      input_snapshot_json: inputSnapshot,
      calculation_trace_json: calculation.trace,
      result_summary_json: calculation.summary,
      created_by: user.id,
      calculated_by: user.id,
      calculated_at: new Date().toISOString(),
    });
    const run = await this.db.single<Row>(this.db.from("audit_trend_runs").insert(runPayload).select("*").single());
    await this.persistTrendChildren(user, run, calculation);
    if (trendType === "Repeat Finding Analysis") await this.detectRepeatFindings(user, { ...filters, trendRunId: run.id, dateFrom: start, dateTo: end });
    await this.write(user, { trendRunId: run.id, type: "Trend Run Calculated", title: "Audit trend run calculated", after: run });
    return this.trendRunDetail(user, run.id);
  }

  async trendRunDetail(user: RequestUser, trendRunId: string) {
    const run = await this.trendRun(user, trendRunId);
    const [results, sourceRecords, metrics, staleness, history] = await Promise.all([
      this.children(user, "audit_trend_results", trendRunId, "trend_run_id", "created_at"),
      this.children(user, "audit_trend_source_records", trendRunId, "trend_run_id", "created_at"),
      this.children(user, "audit_trend_metric_points", trendRunId, "trend_run_id", "period_start"),
      this.children(user, "audit_trend_staleness_events", trendRunId, "trend_run_id", "detected_at"),
      this.children(user, "audit_trend_history_events", trendRunId, "trend_run_id", "created_at"),
    ]);
    return {
      trendRun: run,
      results,
      sourceRecords: sourceRecords.map((row) => this.redactSource(user, row)),
      metrics,
      staleness,
      history,
      inputSnapshot: run.input_snapshot_json ?? {},
      methodologySnapshot: run.methodology_snapshot_json ?? {},
      calculationTrace: run.calculation_trace_json ?? {},
      explainability: this.explainability(run, results, sourceRecords),
      actionsFoundation: this.actionsFoundation(results),
    };
  }

  async recalculateTrendRun(user: RequestUser, trendRunId: string) {
    const existing = await this.trendRun(user, trendRunId);
    if (existing.archived_at) throw new BadRequestException("Archived trend runs cannot be recalculated.");
    const detail = await this.createTrendRun(user, {
      trendTitle: `${existing.trend_title} recalculation`,
      trendType: existing.trend_type,
      timePeriodStart: existing.time_period_start,
      timePeriodEnd: existing.time_period_end,
      comparePeriodStart: existing.compare_period_start,
      comparePeriodEnd: existing.compare_period_end,
      sourceModules: existing.source_modules_json,
      scope: existing.scope_json,
      ...(existing.filters_json ?? {}),
    });
    await this.db.single<Row>(this.db.from("audit_trend_runs").update({ stale_status: "Superseded by Recalculation", stale_reason: `Recalculated as ${detail.trendRun.trend_code}` }).eq("company_id", user.tenantId).eq("id", trendRunId).select("id").single());
    await this.write(user, { trendRunId, type: "Trend Run Recalculated", title: "Audit trend run recalculated", before: existing, after: detail.trendRun });
    return detail;
  }

  async archiveTrendRun(user: RequestUser, trendRunId: string, dto: Row) {
    const before = await this.trendRun(user, trendRunId);
    const reason = String(dto.reason ?? dto.archiveReason ?? dto.archive_reason ?? "").trim();
    if (!reason) throw new BadRequestException("Archive reason is required.");
    const after = await this.db.single<Row>(this.db.from("audit_trend_runs").update({ trend_status: "Archived", archived_at: new Date().toISOString(), archived_by: user.id, archive_reason: reason, updated_at: new Date().toISOString() }).eq("company_id", user.tenantId).eq("id", trendRunId).select("*").single());
    await this.write(user, { trendRunId, type: "Trend Run Archived", title: "Audit trend run archived", before, after });
    return this.trendRunDetail(user, trendRunId);
  }

  async repeatFindings(user: RequestUser, query: Row = {}) {
    const page = Math.max(1, Number(query.page ?? 1));
    const limit = Math.min(250, Math.max(1, Number(query.limit ?? 25)));
    let request: any = this.db.from("audit_repeat_finding_matches").select("*", { count: "exact" }).eq("company_id", user.tenantId);
    request = this.applyScope(request, user, query);
    request = this.applySimpleFilters(request, query, { repeatStatus: "repeat_status", status: "match_status", siteId: "site_id", unitId: "unit_id", areaId: "area_id", sourceFindingId: "source_finding_id" });
    const { data, count, error } = await request.order("updated_at", { ascending: false }).range((page - 1) * limit, page * limit - 1);
    if (error) throw new BadRequestException(error.message);
    return { rows: data ?? [], total: count ?? 0, page, limit };
  }

  async detectRepeatFindings(user: RequestUser, query: Row = {}) {
    const findings = await this.sourceRows(user, "audit_findings", query, "created_at");
    const settings = await this.settings(user, query.siteId ?? user.selectedSiteId ?? null);
    const pairs = this.detectPairs(findings, settings, query.trendRunId ?? null);
    const rows: Row[] = [];
    for (const pair of pairs) {
      const row = await this.db.single<Row>(
        this.db.from("audit_repeat_finding_matches").upsert(pair, { onConflict: "source_finding_id,matched_finding_id" }).select("*").single(),
      );
      rows.push(row);
    }
    await this.write(user, { trendRunId: query.trendRunId, type: "Repeat Finding Detection Run", title: "Repeat finding detection calculated", after: { detected: rows.length } });
    return { rows, total: rows.length, criteria: this.repeatCriteria(), insufficientData: findings.length < 2 };
  }

  async repeatAnalysis(user: RequestUser, findingId: string) {
    await this.assertSourceAccess(user, "audit_findings", findingId);
    const [sourceMatches, matchedMatches] = await Promise.all([
      this.safeRows(this.db.from("audit_repeat_finding_matches").select("*").eq("company_id", user.tenantId).eq("source_finding_id", findingId)),
      this.safeRows(this.db.from("audit_repeat_finding_matches").select("*").eq("company_id", user.tenantId).eq("matched_finding_id", findingId)),
    ]);
    return { findingId, matches: [...sourceMatches, ...matchedMatches], criteria: this.repeatCriteria() };
  }

  async reviewRepeatFinding(user: RequestUser, matchId: string, action: "confirm" | "reject" | "mark-recurring" | "mark-systemic", dto: Row) {
    const before = await this.match(user, matchId);
    const reason = String(dto.reason ?? dto.reviewReason ?? dto.review_reason ?? "").trim();
    if (!reason) throw new BadRequestException(`${this.title(action)} reason is required.`);
    const repeatStatus = action === "confirm" ? "Confirmed Repeat" : action === "reject" ? "Not Repeat" : action === "mark-systemic" ? "Systemic Issue" : "Recurring Issue";
    const after = await this.db.single<Row>(this.db.from("audit_repeat_finding_matches").update({
      match_status: action === "reject" ? "Rejected" : "Reviewed",
      repeat_status: repeatStatus,
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
      review_decision: this.title(action),
      review_reason: reason,
      updated_at: new Date().toISOString(),
    }).eq("company_id", user.tenantId).eq("id", matchId).select("*").single());
    if (action !== "reject") {
      await this.db.single<Row>(this.db.from("audit_findings").update({ repeat_finding: true, duplicate_repeat_status: repeatStatus, updated_by: user.id, updated_at: new Date().toISOString() }).eq("company_id", user.tenantId).eq("id", before.source_finding_id).select("id").single());
    }
    if (action === "mark-recurring" || action === "mark-systemic") await this.ensureRecurringCluster(user, after, repeatStatus);
    await this.write(user, { repeatMatchId: matchId, type: `Repeat Finding ${this.title(action)}`, title: `Repeat finding ${this.title(action).toLowerCase()}`, before, after });
    return after;
  }

  async recurringIssues(user: RequestUser, query: Row = {}) {
    return this.listTable(user, "audit_recurring_issue_clusters", query, "updated_at", { status: "cluster_status", clusterStatus: "cluster_status", siteId: "site_id", unitId: "unit_id", areaId: "area_id", moduleKey: "module_key" });
  }

  async recurringIssue(user: RequestUser, clusterId: string) {
    const row = await this.record(user, "audit_recurring_issue_clusters", clusterId);
    return { cluster: row, history: await this.children(user, "audit_trend_history_events", clusterId, "recurring_cluster_id", "created_at") };
  }

  async transitionRecurringIssue(user: RequestUser, clusterId: string, action: "close" | "reopen", dto: Row) {
    const before = await this.record(user, "audit_recurring_issue_clusters", clusterId);
    const note = String(dto.reason ?? dto.closureNote ?? dto.closure_note ?? dto.reopenReason ?? "").trim();
    if (!note) throw new BadRequestException(`${this.title(action)} note is required.`);
    const patch = action === "close"
      ? { cluster_status: "Closed", closed_by: user.id, closed_at: new Date().toISOString(), closure_note: note }
      : { cluster_status: "Reopened", closed_by: null, closed_at: null, closure_note: null };
    const after = await this.db.single<Row>(this.db.from("audit_recurring_issue_clusters").update({ ...patch, updated_at: new Date().toISOString() }).eq("company_id", user.tenantId).eq("id", clusterId).select("*").single());
    await this.write(user, { recurringClusterId: clusterId, type: `Recurring Issue ${this.title(action)}`, title: `Recurring issue ${action}`, before, after });
    return after;
  }

  trendView(user: RequestUser, category: string, query: Row = {}) {
    return this.trendRuns(user, { ...query, trendType: category }).then(async (runs) => ({ ...runs, category, latest: runs.rows[0] ? await this.trendRunDetail(user, runs.rows[0].id) : null }));
  }

  continuousImprovement(user: RequestUser, query: Row = {}) {
    return this.listTable(user, "audit_continuous_improvement_opportunities", query, "created_at", { status: "opportunity_status", opportunityStatus: "opportunity_status", opportunityType: "opportunity_type", siteId: "site_id", unitId: "unit_id", areaId: "area_id" });
  }

  async createOpportunity(user: RequestUser, dto: Row) {
    const title = String(dto.opportunityTitle ?? dto.opportunity_title ?? "").trim();
    const type = String(dto.opportunityType ?? dto.opportunity_type ?? "").trim();
    const reason = String(dto.manualCreationReason ?? dto.manual_creation_reason ?? dto.reason ?? "").trim();
    if (!title) throw new BadRequestException("Opportunity title is required.");
    if (!type) throw new BadRequestException("Opportunity type is required.");
    if (!reason && !dto.sourceTrendRunId && !dto.source_trend_run_id && !dto.sourceResultId && !dto.source_result_id) {
      throw new BadRequestException("Manual opportunity creation requires a source reason.");
    }
    const siteId = dto.siteId ?? dto.site_id ?? user.selectedSiteId ?? null;
    if (siteId) this.assertSite(user, String(siteId));
    const payload = this.withoutUndefined({
      company_id: user.tenantId,
      site_id: siteId,
      unit_id: dto.unitId ?? dto.unit_id ?? null,
      area_id: dto.areaId ?? dto.area_id ?? null,
      opportunity_code: await this.nextOpportunityCode(user),
      opportunity_title: title,
      opportunity_type: type,
      opportunity_status: dto.opportunityStatus ?? dto.opportunity_status ?? "Open",
      source_trend_run_id: dto.sourceTrendRunId ?? dto.source_trend_run_id ?? null,
      source_result_id: dto.sourceResultId ?? dto.source_result_id ?? null,
      source_finding_id: dto.sourceFindingId ?? dto.source_finding_id ?? null,
      source_standard_id: dto.sourceStandardId ?? dto.source_standard_id ?? null,
      source_clause_id: dto.sourceClauseId ?? dto.source_clause_id ?? null,
      source_module: dto.sourceModule ?? dto.source_module ?? null,
      severity: dto.severity ?? null,
      priority: dto.priority ?? null,
      recommended_owner_user_id: dto.recommendedOwnerUserId ?? dto.recommended_owner_user_id ?? null,
      recommended_due_date: dto.recommendedDueDate ?? dto.recommended_due_date ?? null,
      recommended_action: dto.recommendedAction ?? dto.recommended_action ?? null,
      manual_creation_reason: reason || null,
      created_by: user.id,
    });
    const row = await this.db.single<Row>(this.db.from("audit_continuous_improvement_opportunities").insert(payload).select("*").single());
    await this.write(user, { opportunityId: row.id, type: "Continuous Improvement Opportunity Created", title: "Audit trend improvement opportunity created", after: row });
    return row;
  }

  async updateOpportunity(user: RequestUser, opportunityId: string, dto: Row) {
    const before = await this.record(user, "audit_continuous_improvement_opportunities", opportunityId);
    const after = await this.db.single<Row>(this.db.from("audit_continuous_improvement_opportunities").update(this.withoutUndefined({
      opportunity_title: dto.opportunityTitle ?? dto.opportunity_title,
      opportunity_type: dto.opportunityType ?? dto.opportunity_type,
      opportunity_status: dto.opportunityStatus ?? dto.opportunity_status,
      severity: dto.severity,
      priority: dto.priority,
      recommended_owner_user_id: dto.recommendedOwnerUserId ?? dto.recommended_owner_user_id,
      recommended_due_date: dto.recommendedDueDate ?? dto.recommended_due_date,
      recommended_action: dto.recommendedAction ?? dto.recommended_action,
      updated_by: user.id,
      updated_at: new Date().toISOString(),
    })).eq("company_id", user.tenantId).eq("id", opportunityId).select("*").single());
    await this.write(user, { opportunityId, type: "Continuous Improvement Opportunity Updated", title: "Audit trend improvement opportunity updated", before, after });
    return after;
  }

  async opportunity(user: RequestUser, opportunityId: string) {
    const opportunity = await this.record(user, "audit_continuous_improvement_opportunities", opportunityId);
    return { opportunity, history: await this.children(user, "audit_trend_history_events", opportunityId, "opportunity_id", "created_at") };
  }

  async createActionFoundation(user: RequestUser, opportunityId: string, dto: Row) {
    const before = await this.record(user, "audit_continuous_improvement_opportunities", opportunityId);
    const actionId = dto.actionEngineId ?? dto.action_engine_id ?? `foundation:${opportunityId}`;
    const after = await this.db.single<Row>(this.db.from("audit_continuous_improvement_opportunities").update({ opportunity_status: "Action Foundation Created", action_engine_id: actionId, updated_by: user.id, updated_at: new Date().toISOString() }).eq("company_id", user.tenantId).eq("id", opportunityId).select("*").single());
    await this.write(user, { opportunityId, type: "Continuous Improvement Action Foundation Created", title: "Audit trend action foundation created", before, after });
    return after;
  }

  async closeOpportunity(user: RequestUser, opportunityId: string, dto: Row) {
    const before = await this.record(user, "audit_continuous_improvement_opportunities", opportunityId);
    const note = String(dto.reason ?? dto.closureNote ?? dto.closure_note ?? "").trim();
    if (!note) throw new BadRequestException("Closure note is required.");
    const after = await this.db.single<Row>(this.db.from("audit_continuous_improvement_opportunities").update({ opportunity_status: "Closed", closed_by: user.id, closed_at: new Date().toISOString(), closure_note: note, updated_by: user.id, updated_at: new Date().toISOString() }).eq("company_id", user.tenantId).eq("id", opportunityId).select("*").single());
    await this.write(user, { opportunityId, type: "Continuous Improvement Opportunity Closed", title: "Audit trend improvement opportunity closed", before, after });
    return after;
  }

  async archiveOpportunity(user: RequestUser, opportunityId: string, dto: Row) {
    const before = await this.record(user, "audit_continuous_improvement_opportunities", opportunityId);
    const reason = String(dto.reason ?? dto.archiveReason ?? dto.archive_reason ?? "").trim();
    if (!reason) throw new BadRequestException("Archive reason is required.");
    const after = await this.db.single<Row>(this.db.from("audit_continuous_improvement_opportunities").update({ opportunity_status: "Archived", archived_by: user.id, archived_at: new Date().toISOString(), archive_reason: reason, updated_by: user.id, updated_at: new Date().toISOString() }).eq("company_id", user.tenantId).eq("id", opportunityId).select("*").single());
    await this.write(user, { opportunityId, type: "Continuous Improvement Opportunity Archived", title: "Audit trend improvement opportunity archived", before, after });
    return after;
  }

  async settings(user: RequestUser, siteId?: string | null) {
    const scopedSite = siteId ?? user.selectedSiteId ?? null;
    if (scopedSite) this.assertSite(user, String(scopedSite));
    let request: any = this.db.from("audit_trend_settings").select("*").eq("company_id", user.tenantId);
    request = scopedSite ? request.eq("site_id", scopedSite) : request.is("site_id", null);
    const rows = await this.safeRows(request.limit(1));
    if (rows[0]) return rows[0];
    const created = await this.db.single<Row>(this.db.from("audit_trend_settings").insert({ company_id: user.tenantId, site_id: scopedSite, updated_by: user.id }).select("*").single());
    return created;
  }

  async updateSettings(user: RequestUser, dto: Row) {
    const siteId = dto.siteId ?? dto.site_id ?? user.selectedSiteId ?? null;
    const before = await this.settings(user, siteId);
    const allowed = [
      "repeat_detection_window_days",
      "repeat_after_capa_window_days",
      "minimum_matches_for_recurring_issue",
      "minimum_matches_for_systemic_issue",
      "enable_similarity_matching",
      "similarity_threshold",
      "require_review_for_repeat_confirmation",
      "auto_detect_repeat_findings",
      "auto_create_recurring_issue_cluster",
      "auto_create_improvement_opportunity",
      "auto_mark_trends_stale_on_source_change",
      "auto_notify_owner_on_critical_trend",
      "auto_notify_audit_lead_on_repeat_after_capa",
      "settings_json",
    ];
    const patch: Row = { updated_by: user.id, updated_at: new Date().toISOString() };
    for (const key of allowed) if (key in dto) patch[key] = dto[key];
    const after = await this.db.single<Row>(this.db.from("audit_trend_settings").update(patch).eq("company_id", user.tenantId).eq("id", before.id).select("*").single());
    await this.write(user, { type: "Audit Trend Settings Updated", title: "Audit trend settings updated", before, after });
    return after;
  }

  sourceHistory(user: RequestUser, sourceModule: string, sourceRecordId: string, query: Row = {}) {
    return this.unifiedEvents(user, { ...query, sourceModule: this.sourceModuleLabel(sourceModule), sourceRecordId });
  }

  sourceTrends(user: RequestUser, sourceModule: string, sourceRecordId: string, query: Row = {}) {
    return this.trendRuns(user, { ...query, search: sourceRecordId, sourceModule: this.sourceModuleLabel(sourceModule) });
  }

  async scopedHistory(user: RequestUser, scope: "site" | "unit" | "area", id: string, query: Row = {}) {
    return this.unifiedEvents(user, { ...query, [`${scope}Id`]: id });
  }

  async scopedTrends(user: RequestUser, scope: "site" | "unit" | "area", id: string, query: Row = {}) {
    return this.trendRuns(user, { ...query, [`${scope}Id`]: id });
  }

  private async trendRun(user: RequestUser, trendRunId: string) {
    const run = await this.db.single<Row>(this.db.from("audit_trend_runs").select("*").eq("company_id", user.tenantId).eq("id", trendRunId).single());
    if (!run || !this.canSeeSite(user, run.site_id)) throw new NotFoundException("Trend run not found.");
    return run;
  }

  private async record(user: RequestUser, table: string, id: string) {
    const row = await this.db.single<Row>(this.db.from(table).select("*").eq("company_id", user.tenantId).eq("id", id).single());
    if (!row || !this.canSeeSite(user, row.site_id)) throw new NotFoundException("Record not found.");
    return row;
  }

  private async match(user: RequestUser, matchId: string) {
    return this.record(user, "audit_repeat_finding_matches", matchId);
  }

  private async assertSourceAccess(user: RequestUser, table: string, id: string) {
    await this.record(user, table, id);
  }

  private async children(user: RequestUser, table: string, parentId: string, parentColumn: string, orderColumn: string) {
    const rows = await this.safeRows(this.db.from(table).select("*").eq("company_id", user.tenantId).eq(parentColumn, parentId).order(orderColumn, { ascending: false }));
    return rows.filter((row) => this.canSeeSite(user, row.site_id));
  }

  private async listTable(user: RequestUser, table: string, query: Row, orderColumn: string, filters: Record<string, string>) {
    const page = Math.max(1, Number(query.page ?? 1));
    const limit = Math.min(250, Math.max(1, Number(query.limit ?? 25)));
    let request: any = this.db.from(table).select("*", { count: "exact" }).eq("company_id", user.tenantId);
    request = this.applyScope(request, user, query);
    request = this.applySimpleFilters(request, query, filters);
    if (!this.truthy(query.includeArchived) && table !== "audit_repeat_finding_matches") request = request.is("archived_at", null);
    const { data, count, error } = await request.order(orderColumn, { ascending: false }).range((page - 1) * limit, page * limit - 1);
    if (error) throw new BadRequestException(error.message);
    return { rows: data ?? [], total: count ?? 0, page, limit };
  }

  private async sourceRows(user: RequestUser, table: string, query: Row, orderColumn: string) {
    let request: any = this.db.from(table).select("*").eq("company_id", user.tenantId);
    request = this.applyScope(request, user, query);
    request = this.applySimpleFilters(request, query, {
      programId: "program_id",
      planId: "plan_id",
      executionId: "execution_id",
      findingId: "finding_id",
      capaId: "capa_id",
      standardId: "standard_id",
      clauseId: "clause_id",
      moduleKey: "module_key",
      severity: "severity",
      criticality: "criticality",
      ownerId: "owner_user_id",
      departmentId: "responsible_department_id",
      siteId: "site_id",
      unitId: "unit_id",
      areaId: "area_id",
      equipmentId: "equipment_id",
    });
    if (query.dateFrom) request = request.gte(orderColumn, query.dateFrom);
    if (query.dateTo) request = request.lte(orderColumn, query.dateTo);
    if (!this.truthy(query.includeArchived) && table !== "audit_history_unified_events") request = request.is("archived_at", null);
    return (await this.safeRows(request.order(orderColumn, { ascending: false }).limit(1000))).filter((row) => this.canSeeSite(user, row.site_id));
  }

  private async safeRows(query: PromiseLike<any>): Promise<Row[]> {
    const { data, error } = await query;
    if (error) {
      if (/does not exist|column .* does not exist/i.test(error.message ?? "")) return [];
      throw new BadRequestException(error.message);
    }
    return (data ?? []) as Row[];
  }

  private applyScope(request: any, user: RequestUser, query: Row) {
    const siteId = query.siteId ?? query.site_id ?? null;
    if (siteId) {
      this.assertSite(user, String(siteId));
      return request.eq("site_id", siteId);
    }
    if (user.selectedSiteId && !user.corporateView && !user.isSuperAdmin) return request.eq("site_id", user.selectedSiteId);
    return request;
  }

  private applySimpleFilters(request: any, query: Row, filters: Record<string, string>) {
    let scoped = request;
    for (const [input, column] of Object.entries(filters)) {
      const value = query[input] ?? query[this.snake(input)];
      if (value !== undefined && value !== null && value !== "") scoped = scoped.eq(column, value);
    }
    return scoped;
  }

  private async completedAudits(user: RequestUser, query: Row) {
    const executions = await this.sourceRows(user, "audit_executions", query, "updated_at");
    return executions.filter((row) => /completed|closed|approved/i.test(String(row.execution_status ?? row.status ?? ""))).length;
  }

  private async inputSnapshot(user: RequestUser, query: Row) {
    const [findings, capa, capaActions, capaEffectiveness, evidence, evidenceGaps, scores, standards, approvals, reports] = await Promise.all([
      this.sourceRows(user, "audit_findings", query, "created_at"),
      this.sourceRows(user, "audit_capa_packages", query, "created_at"),
      this.sourceRows(user, "audit_capa_actions", query, "created_at"),
      this.sourceRows(user, "audit_capa_effectiveness_checks", query, "created_at"),
      this.sourceRows(user, "audit_evidence_records", query, "created_at"),
      this.sourceRows(user, "audit_evidence_gaps", query, "created_at"),
      this.sourceRows(user, "audit_score_runs", query, "created_at"),
      this.sourceRows(user, "audit_standard_mappings", query, "created_at"),
      this.sourceRows(user, "audit_approval_packages", query, "created_at"),
      this.sourceRows(user, "audit_reports", query, "created_at"),
    ]);
    return { findings, capa, capaActions, capaEffectiveness, evidence, evidenceGaps, scores, standards, approvals, reports, filters: this.filtersFromQuery(query) };
  }

  private methodologySnapshot(settings: Row, trendType: string, overrides: Row = {}) {
    return {
      trendType,
      repeatCriteria: this.repeatCriteria(),
      settings,
      overrides,
      generatedBy: "Audit History / Trends Phase 12 backend",
      generatedAt: new Date().toISOString(),
    };
  }

  private calculateTrendResults(trendType: string, snapshot: Row, start: string, end: string, compareStart?: string | null, compareEnd?: string | null) {
    const findings = snapshot.findings ?? [];
    const evidenceGaps = snapshot.evidenceGaps ?? [];
    const capa = snapshot.capa ?? [];
    const scores = snapshot.scores ?? [];
    const reports = snapshot.reports ?? [];
    const approvals = snapshot.approvals ?? [];
    const sourceCount = findings.length + evidenceGaps.length + capa.length + scores.length + reports.length + approvals.length;
    const insufficient = sourceCount < 2;
    const results: Row[] = [];
    const add = (title: string, category: string, direction: string, sourceRows: Row[], followUp?: string) => {
      results.push({
        result_title: title,
        result_category: insufficient ? "Insufficient Data" : category,
        trend_direction: insufficient ? "Unknown" : direction,
        confidence: this.confidence(sourceRows.length),
        severity: this.maxSeverity(sourceRows),
        criticality: this.maxCriticality(sourceRows),
        source_count: sourceRows.length,
        matched_records_json: sourceRows.map((row) => ({ id: row.id, code: row.finding_code ?? row.capa_code ?? row.evidence_code ?? row.score_code ?? row.report_code, status: row.finding_status ?? row.capa_status ?? row.evidence_status ?? row.score_status ?? row.report_status })),
        key_drivers_json: this.keyDrivers(sourceRows),
        supporting_records_json: sourceRows.slice(0, 25),
        recommended_follow_up: followUp ?? null,
        report_ready: !insufficient && sourceRows.length > 0,
        result_status: insufficient ? "Needs Data" : "Open",
      });
    };
    if (trendType === "Repeat Finding Analysis" || trendType === "Finding Severity Trend" || trendType === "Custom") {
      add("Finding recurrence and severity pattern", findings.some((row: Row) => row.repeat_finding) ? "Recurring Pattern" : "New Pattern", "Unknown", findings, findings.length ? "Review repeated clauses, modules, owners, and CAPA effectiveness before management review." : undefined);
    }
    if (trendType === "CAPA Effectiveness Trend" || trendType === "CAPA Overdue Trend" || trendType === "Custom") {
      const ineffective = capa.filter((row: Row) => /ineffective|reopened|overdue/i.test(`${row.effectiveness_status ?? ""} ${row.effectiveness_result ?? ""} ${row.capa_status ?? ""}`) || this.isPast(row.overall_due_date));
      add("CAPA effectiveness and overdue pattern", ineffective.length ? "CAPA Ineffective" : "Stable", ineffective.length ? "Declining" : "Stable", ineffective.length ? ineffective : capa, ineffective.length ? "Evaluate CAPA quality, verification evidence, and recurring owner/department overdue patterns." : undefined);
    }
    if (trendType === "Evidence Gap Trend" || trendType === "Custom") {
      add("Evidence gap recurrence pattern", evidenceGaps.length ? "Evidence Weakness" : "Stable", evidenceGaps.length ? "Declining" : "Stable", evidenceGaps, "Review repeated missing evidence requirements and checklist collection rules.");
    }
    if (trendType === "Compliance Score Trend" || trendType === "Custom") {
      const scoreTrend = this.scoreTrend(scores);
      add("Compliance score movement", scoreTrend.declining ? "Declining" : scoreTrend.improving ? "Improving" : "Stable", scoreTrend.direction, scores, "Use locked/current score runs and investigate declining site, unit, module, standard, or clause scores.");
    }
    if (trendType === "Review Approval Cycle Trend" || trendType === "Custom") {
      add("Review approval cycle SLA pattern", approvals.some((row: Row) => this.isPast(row.due_date ?? row.review_due_date)) ? "Review Delay" : "Stable", "Unknown", approvals, "Review returned, delayed, rejected, and condition-based approval cycles.");
    }
    if (trendType === "Report Export Trend" || trendType === "Custom") {
      add("Report generation and stale export pattern", reports.some((row: Row) => row.stale_status && row.stale_status !== "Current") ? "Report Delay" : "Stable", "Unknown", reports, "Review stale report sources, regeneration queue, export access, and controlled report status.");
    }
    if (!results.length) add(`${trendType} result`, "Insufficient Data", "Unknown", [], undefined);
    const metricPoints = this.buildMetricPoints(results, start, end);
    return {
      readinessStatus: insufficient ? "Insufficient Data" : "Calculated",
      summary: { trendType, sourceCount, resultCount: results.length, period: { start, end }, comparePeriod: { start: compareStart ?? null, end: compareEnd ?? null } },
      trace: { calculatedAt: new Date().toISOString(), sourceCounts: Object.fromEntries(Object.entries(snapshot).filter(([, value]) => Array.isArray(value)).map(([key, value]) => [key, value.length])), rules: this.repeatCriteria(), insufficientData: insufficient },
      results,
      metricPoints,
      sourceRecords: this.sourceRecordsFromSnapshot(snapshot),
    };
  }

  private async persistTrendChildren(user: RequestUser, run: Row, calculation: Row) {
    for (const result of calculation.results ?? []) {
      await this.db.single<Row>(this.db.from("audit_trend_results").insert({ ...result, company_id: user.tenantId, site_id: run.site_id, trend_run_id: run.id }).select("id").single());
    }
    const records = (calculation.sourceRecords ?? []).map((row: Row) => ({ ...row, company_id: user.tenantId, site_id: row.site_id ?? run.site_id, trend_run_id: run.id }));
    if (records.length) await this.db.from("audit_trend_source_records").insert(records);
    const metrics = (calculation.metricPoints ?? []).map((row: Row) => ({ ...row, company_id: user.tenantId, site_id: run.site_id, trend_run_id: run.id }));
    if (metrics.length) await this.db.from("audit_trend_metric_points").insert(metrics);
  }

  private sourceRecordsFromSnapshot(snapshot: Row) {
    const configs: Array<[string, string, string]> = [
      ["findings", "Findings", "Finding"],
      ["capa", "CAPA", "CAPA"],
      ["evidence", "Evidence", "Evidence"],
      ["evidenceGaps", "Evidence", "Evidence Gap"],
      ["scores", "Scoring", "Score Run"],
      ["standards", "Standards Mapping", "Standard Mapping"],
      ["approvals", "Review & Approval", "Approval Package"],
      ["reports", "Reports / Export", "Report"],
    ];
    return configs.flatMap(([key, module, type]) => (snapshot[key] ?? []).map((row: Row) => ({
      site_id: row.site_id ?? null,
      source_module: module,
      source_object_type: type,
      source_record_id: row.id,
      source_snapshot_json: row,
      included: true,
      restricted: Boolean(row.restricted || row.confidentiality_level === "Restricted"),
    })));
  }

  private detectPairs(findings: Row[], settings: Row, trendRunId?: string | null) {
    const rows: Row[] = [];
    const windowMs = Number(settings.repeat_detection_window_days ?? 1095) * 24 * 60 * 60 * 1000;
    for (let i = 0; i < findings.length; i += 1) {
      for (let j = i + 1; j < findings.length; j += 1) {
        const source = findings[i];
        const matched = findings[j];
        if (!source?.id || !matched?.id) continue;
        const criteria = this.matchCriteria(source, matched);
        const strength = Object.values(criteria).filter(Boolean).length / Object.keys(criteria).length;
        const first = new Date(source.created_at ?? Date.now()).getTime();
        const latest = new Date(matched.created_at ?? Date.now()).getTime();
        if (strength >= Number(settings.similarity_threshold ?? 0.75) || (strength >= 0.45 && Math.abs(first - latest) <= windowMs)) {
          rows.push({
            company_id: source.company_id,
            site_id: source.site_id ?? matched.site_id ?? null,
            unit_id: source.unit_id ?? matched.unit_id ?? null,
            area_id: source.area_id ?? matched.area_id ?? null,
            source_finding_id: source.id,
            matched_finding_id: matched.id,
            trend_run_id: trendRunId ?? null,
            match_status: "Detected",
            repeat_status: this.repeatStatusFor(source, matched),
            match_strength: Math.round(strength * 100) / 100,
            match_criteria_json: criteria,
            match_explanation: this.matchExplanation(criteria),
            recurrence_count: 2,
            first_occurrence_at: source.created_at ?? matched.created_at ?? null,
            latest_occurrence_at: matched.created_at ?? source.created_at ?? null,
          });
        }
      }
    }
    return rows;
  }

  private matchCriteria(source: Row, matched: Row) {
    return {
      sameSite: Boolean(source.site_id && source.site_id === matched.site_id),
      sameUnit: Boolean(source.unit_id && source.unit_id === matched.unit_id),
      sameArea: Boolean(source.area_id && source.area_id === matched.area_id),
      sameEquipment: Boolean(source.equipment_id && source.equipment_id === matched.equipment_id),
      sameChecklistItem: Boolean(source.checklist_item_id && source.checklist_item_id === matched.checklist_item_id),
      sameFindingType: Boolean(source.finding_type && source.finding_type === matched.finding_type),
      sameSeverityOrCriticality: Boolean((source.severity && source.severity === matched.severity) || (source.criticality && source.criticality === matched.criticality)),
      similarTitleDescription: this.tokenOverlap(`${source.finding_title ?? ""} ${source.finding_description ?? ""}`, `${matched.finding_title ?? ""} ${matched.finding_description ?? ""}`) >= 0.5,
      sameCauseCategory: Boolean(source.recurrence_category && source.recurrence_category === matched.recurrence_category),
      sameDepartment: Boolean(source.responsible_department_id && source.responsible_department_id === matched.responsible_department_id),
      repeatAfterCapa: Boolean(source.capa_record_id || matched.capa_record_id || source.capa_required || matched.capa_required),
    };
  }

  private repeatStatusFor(source: Row, matched: Row) {
    if (source.capa_record_id || matched.capa_record_id || source.capa_required || matched.capa_required) return "Repeat After CAPA";
    if (source.repeat_finding || matched.repeat_finding) return "Confirmed Repeat";
    return "Potential Repeat";
  }

  private async ensureRecurringCluster(user: RequestUser, match: Row, repeatStatus: string) {
    const source = await this.record(user, "audit_findings", match.source_finding_id);
    const cluster = await this.db.single<Row>(this.db.from("audit_recurring_issue_clusters").insert(this.withoutUndefined({
      company_id: user.tenantId,
      site_id: source.site_id ?? null,
      unit_id: source.unit_id ?? null,
      area_id: source.area_id ?? null,
      equipment_id: source.equipment_id ?? null,
      cluster_code: await this.nextClusterCode(user),
      cluster_title: `${repeatStatus}: ${source.finding_title ?? source.finding_code}`,
      cluster_type: repeatStatus,
      cluster_status: "Open",
      severity: source.severity ?? null,
      criticality: source.criticality ?? null,
      module_key: source.module_key ?? source.finding_type ?? null,
      finding_type: source.finding_type ?? null,
      cause_category: source.recurrence_category ?? null,
      occurrence_count: match.recurrence_count ?? 2,
      first_detected_at: match.first_occurrence_at ?? new Date().toISOString(),
      latest_detected_at: match.latest_occurrence_at ?? new Date().toISOString(),
      linked_findings_json: [match.source_finding_id, match.matched_finding_id],
      recommended_follow_up: "Review recurring issue pattern and create improvement/action foundation where supported.",
      owner_user_id: source.owner_user_id ?? null,
      created_by: user.id,
    })).select("*").single());
    await this.write(user, { recurringClusterId: cluster.id, repeatMatchId: match.id, type: "Recurring Issue Cluster Created", title: "Audit recurring issue cluster created", after: cluster });
  }

  private async write(user: RequestUser, input: Row) {
    const event = this.withoutUndefined({
      company_id: user.tenantId,
      site_id: input.siteId ?? null,
      unit_id: input.unitId ?? null,
      area_id: input.areaId ?? null,
      trend_run_id: input.trendRunId ?? null,
      result_id: input.resultId ?? null,
      repeat_match_id: input.repeatMatchId ?? null,
      recurring_cluster_id: input.recurringClusterId ?? null,
      opportunity_id: input.opportunityId ?? null,
      event_type: input.type,
      event_title: input.title,
      event_description: input.description ?? input.title,
      before_value_json: input.before ?? null,
      after_value_json: input.after ?? null,
      actor_user_id: user.id,
      source_module: "Audit History / Trends",
      source_record_id: input.trendRunId ?? input.repeatMatchId ?? input.recurringClusterId ?? input.opportunityId ?? null,
    });
    const inserted = await this.db.single<Row>(this.db.from("audit_trend_history_events").insert(event).select("id").single());
    await this.audit.write({
      tenantId: user.tenantId,
      actorId: user.id,
      action: input.type,
      entityType: "audit_history_trend",
      entityId: event.source_record_id ?? inserted.id,
      before: input.before as JsonValue,
      after: input.after as JsonValue,
      metadata: { title: input.title, trendRunId: input.trendRunId ?? null, repeatMatchId: input.repeatMatchId ?? null, recurringClusterId: input.recurringClusterId ?? null, opportunityId: input.opportunityId ?? null } as JsonValue,
    });
    return { ...event, id: inserted.id };
  }

  private repeatCriteria() {
    return ["Same standard / clause", "Same module", "Same site / unit / area", "Same equipment", "Same checklist item", "Same finding type", "Same severity/criticality pattern", "Similar title/description foundation", "Same suspected cause / cause category", "Same responsible department", "Same CAPA failure / ineffectiveness", "Repeated within configurable period", "Repeated after CAPA closure", "Repeated across multiple audits"];
  }

  private explainability(run: Row, results: Row[], sourceRecords: Row[]) {
    return {
      trendRunId: run.id,
      methodology: run.methodology_snapshot_json,
      calculationTrace: run.calculation_trace_json,
      results: results.map((result) => ({ id: result.id, title: result.result_title, category: result.result_category, confidence: result.confidence, sourceCount: result.source_count, keyDrivers: result.key_drivers_json })),
      sourceRecordCount: sourceRecords.length,
      warning: sourceRecords.length ? null : "No accessible source records were available for this trend run.",
    };
  }

  private actionsFoundation(results: Row[]) {
    return results.filter((result) => result.recommended_follow_up).map((result) => ({
      resultId: result.id,
      title: result.result_title,
      recommendedActionFoundation: result.recommended_follow_up,
      sourceCount: result.source_count,
      confidence: result.confidence,
      actionEngineStatus: "Foundation only",
    }));
  }

  private buildMetricPoints(results: Row[], start: string, end: string) {
    return results.map((result) => ({
      metric_key: String(result.result_category ?? "trend").toLowerCase().replace(/[^a-z0-9]+/g, "_"),
      metric_label: result.result_title,
      metric_category: result.result_category,
      period_start: start,
      period_end: end,
      value: result.source_count ?? 0,
      numerator: result.source_count ?? 0,
      denominator: result.source_count ?? 0,
      unit: "records",
      dimension_json: { direction: result.trend_direction, confidence: result.confidence },
      source_count: result.source_count ?? 0,
    }));
  }

  private scoreTrend(rows: Row[]) {
    const sorted = [...rows].filter((row) => row.final_score !== null || row.score_percent !== null).sort((a, b) => new Date(a.calculated_at ?? a.created_at ?? 0).getTime() - new Date(b.calculated_at ?? b.created_at ?? 0).getTime());
    if (sorted.length < 2) return { direction: "Unknown", improving: 0, declining: 0, points: sorted };
    const firstRow = sorted[0]!;
    const lastRow = sorted[sorted.length - 1]!;
    const first = Number(firstRow.final_score ?? firstRow.score_percent ?? 0);
    const last = Number(lastRow.final_score ?? lastRow.score_percent ?? 0);
    return { direction: last > first ? "Improving" : last < first ? "Declining" : "Stable", improving: last > first ? 1 : 0, declining: last < first ? 1 : 0, first, last, points: sorted };
  }

  private capaTrend(rows: Row[]) {
    return {
      total: rows.length,
      ineffective: rows.filter((row) => /ineffective/i.test(`${row.effectiveness_status ?? ""} ${row.effectiveness_result ?? ""}`)).length,
      overdue: rows.filter((row) => this.isPast(row.overall_due_date)).length,
      reopened: rows.filter((row) => row.reopened_at).length,
      byStatus: this.group(rows, "capa_status"),
    };
  }

  private timeBuckets(rows: Row[], dateColumn: string, predicate?: (row: Row) => boolean) {
    const buckets = new Map<string, number>();
    for (const row of rows) {
      if (predicate && !predicate(row)) continue;
      const value = row[dateColumn] ?? row.created_at ?? row.updated_at;
      if (!value) continue;
      const date = new Date(value);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      buckets.set(key, (buckets.get(key) ?? 0) + 1);
    }
    return Array.from(buckets.entries()).map(([period, count]) => ({ period, count }));
  }

  private heatmap(rows: Row[]) {
    return Object.values(rows.reduce<Record<string, Row>>((acc, row) => {
      const key = `${row.site_id ?? "Company"}|${row.unit_id ?? "All Units"}|${row.source_module ?? "Findings"}`;
      acc[key] ??= { key, siteId: row.site_id ?? null, unitId: row.unit_id ?? null, module: row.source_module ?? "Findings", count: 0 };
      acc[key].count += 1;
      return acc;
    }, {}));
  }

  private group(rows: Row[], column: string) {
    const groups = new Map<string, number>();
    for (const row of rows) groups.set(String(row[column] ?? "Unassigned"), (groups.get(String(row[column] ?? "Unassigned")) ?? 0) + 1);
    return Array.from(groups.entries()).map(([key, count]) => ({ key, count }));
  }

  private keyDrivers(rows: Row[]) {
    return {
      bySite: this.group(rows, "site_id").slice(0, 5),
      byUnit: this.group(rows, "unit_id").slice(0, 5),
      byCriticality: this.group(rows, "criticality").slice(0, 5),
      byStatus: this.group(rows, "finding_status").slice(0, 5),
    };
  }

  private uniqueCount(rows: Row[], column: string) {
    return new Set(rows.map((row) => row[column]).filter(Boolean)).size;
  }

  private maxSeverity(rows: Row[]) {
    return this.highest(rows.map((row) => row.severity));
  }

  private maxCriticality(rows: Row[]) {
    return this.highest(rows.map((row) => row.criticality));
  }

  private highest(values: unknown[]) {
    const order = ["Low", "Medium", "High", "Critical", "Safety-Critical", "Regulatory-Critical", "PSM-Critical"];
    return values.filter(Boolean).map(String).sort((a, b) => order.indexOf(b) - order.indexOf(a))[0] ?? null;
  }

  private confidence(sourceCount: number) {
    if (sourceCount >= 10) return "High";
    if (sourceCount >= 4) return "Medium";
    if (sourceCount >= 2) return "Low";
    return "Insufficient Data";
  }

  private tokenOverlap(left: string, right: string) {
    const a = new Set(left.toLowerCase().split(/[^a-z0-9]+/).filter((token) => token.length > 3));
    const b = new Set(right.toLowerCase().split(/[^a-z0-9]+/).filter((token) => token.length > 3));
    if (!a.size || !b.size) return 0;
    return [...a].filter((token) => b.has(token)).length / Math.max(a.size, b.size);
  }

  private matchExplanation(criteria: Row) {
    const matched = Object.entries(criteria).filter(([, value]) => value).map(([key]) => key.replace(/[A-Z]/g, (m) => ` ${m.toLowerCase()}`));
    return matched.length ? `Matched on ${matched.join(", ")}.` : "Potential text/date match requires review.";
  }

  private canSeeSite(user: RequestUser, siteId?: string | null) {
    if (!siteId || user.isSuperAdmin || user.corporateView) return true;
    return user.siteIds?.includes(siteId) || user.activeSiteId === siteId || user.selectedSiteId === siteId;
  }

  private assertSite(user: RequestUser, siteId: string) {
    if (!this.canSeeSite(user, siteId)) throw new ForbiddenException("You do not have access to the selected site.");
  }

  private redactSource(user: RequestUser, row: Row) {
    if (!row?.restricted) return row;
    const canViewRestricted = user.permissions?.includes("audit.evidence.view_restricted") || user.permissions?.includes("audit.trend.source_records.view") || user.isCompanyAdmin || user.isSuperAdmin;
    if (canViewRestricted) return row;
    return { ...row, source_snapshot_json: { restricted: true }, before_value_json: null, after_value_json: null, event_description: "Restricted source record", restricted: true };
  }

  private sourceModuleLabel(module: string) {
    const normalized = module.toLowerCase();
    if (normalized.includes("program")) return "Program";
    if (normalized.includes("plan")) return "Plan";
    if (normalized.includes("execution")) return "Execution";
    if (normalized.includes("finding")) return "Findings";
    if (normalized.includes("capa")) return "CAPA";
    if (normalized.includes("evidence")) return "Evidence";
    if (normalized.includes("scoring")) return "Scoring";
    if (normalized.includes("standards")) return "Standards Mapping";
    if (normalized.includes("report")) return "Reports / Export";
    return module;
  }

  private dimensionColumn(dimension: string) {
    if (dimension === "by-site") return "site_id";
    if (dimension === "by-unit") return "unit_id";
    if (dimension === "by-standard") return "source_standard_id";
    if (dimension === "by-clause") return "source_clause_id";
    if (dimension === "by-owner") return "actor_user_id";
    if (dimension === "by-equipment") return "equipment_id";
    if (dimension === "by-department") return "responsible_department_id";
    return "source_module";
  }

  private filtersFromQuery(query: Row) {
    return Object.fromEntries(Object.entries(query).filter(([, value]) => value !== undefined && value !== null && value !== ""));
  }

  private requiredDate(value: unknown, message: string) {
    const date = String(value ?? "").slice(0, 10);
    if (!date || Number.isNaN(new Date(date).getTime())) throw new BadRequestException(message);
    return date;
  }

  private isPast(value: unknown) {
    return Boolean(value && new Date(String(value)).getTime() < Date.now());
  }

  private truthy(value: unknown) {
    return value === true || value === "true" || value === "1" || value === 1;
  }

  private search(value: string) {
    return value.replace(/[,%()]/g, " ").trim();
  }

  private snake(value: string) {
    return value.replace(/[A-Z]/g, (m) => `_${m.toLowerCase()}`);
  }

  private title(value: string) {
    return value.replace(/[-_]/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
  }

  private withoutUndefined(row: Row) {
    return Object.fromEntries(Object.entries(row).filter(([, value]) => value !== undefined));
  }

  private async nextTrendCode(user: RequestUser) {
    const rows = await this.safeRows(this.db.from("audit_trend_runs").select("id").eq("company_id", user.tenantId));
    return `AUD-TRD-${new Date().getFullYear()}-${String(rows.length + 1).padStart(6, "0")}`;
  }

  private async nextOpportunityCode(user: RequestUser) {
    const rows = await this.safeRows(this.db.from("audit_continuous_improvement_opportunities").select("id").eq("company_id", user.tenantId));
    return `AUD-CI-${new Date().getFullYear()}-${String(rows.length + 1).padStart(6, "0")}`;
  }

  private async nextClusterCode(user: RequestUser) {
    const rows = await this.safeRows(this.db.from("audit_recurring_issue_clusters").select("id").eq("company_id", user.tenantId));
    return `AUD-RI-${new Date().getFullYear()}-${String(rows.length + 1).padStart(6, "0")}`;
  }
}
