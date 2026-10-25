import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { AuditService } from "../audit/audit.service";
import { RequestUser } from "../common/decorators/current-user.decorator";
import { SupabaseService } from "../database/supabase.service";
import { ExecutiveAggregationService } from "./executive-aggregation.service";

type Row = Record<string, any>;
type ScopeType =
  | "company"
  | "site"
  | "department"
  | "unit"
  | "area"
  | "equipment";

@Injectable()
export class ExecutivePerformanceService {
  constructor(
    private readonly db: SupabaseService,
    private readonly audit: AuditService,
    private readonly aggregation: ExecutiveAggregationService,
  ) {}

  async dashboard(user: RequestUser, query: Row = {}) {
    this.require(user, "executive.performance.dashboard.view");
    const company = await this.company(user, query);
    const sites = await this.scopes(user, "site", query);
    return {
      company,
      sites: sites.rows,
      summary: {
        sitesMonitored: sites.total,
        activeAlerts: company.critical_alert_count,
        overdueActions: company.overdue_action_count,
        pendingApprovals: company.pending_approval_count,
        staleRecords: company.stale_record_count,
        unavailableModules: company.unavailable_module_count,
        latestAggregationRun: company.aggregation_run_id ?? null,
      },
    };
  }
  async company(user: RequestUser, query: Row = {}) {
    this.require(user, "executive.performance.company.view");
    return this.materialize(user, "company", null, "Company", query, true);
  }
  async scopes(user: RequestUser, type: ScopeType, query: Row = {}) {
    this.require(user, `executive.performance.${type}.view`);
    const list = await this.records(user, type, query);
    const rows = await Promise.all(
      list.map((item) =>
        this.materialize(
          user,
          type,
          item.id,
          item.label,
          { ...query, siteId: item.siteId ?? query.siteId },
          true,
        ),
      ),
    );
    const sort = String(query.sort ?? "performance_score_foundation.desc");
    const [field = "performance_score_foundation", direction] = sort.split(".");
    rows.sort((a: Row, b: Row) => {
      const av = a[field] ?? -1;
      const bv = b[field] ?? -1;
      return direction === "asc"
        ? Number(av) - Number(bv)
        : Number(bv) - Number(av);
    });
    const offset = Math.max(0, Number(query.offset ?? 0));
    const limit = Math.min(100, Math.max(1, Number(query.limit ?? 50)));
    return { rows: rows.slice(offset, offset + limit), total: rows.length };
  }
  async detail(
    user: RequestUser,
    type: ScopeType,
    id: string,
    query: Row = {},
  ) {
    this.require(user, `executive.performance.${type}.view`);
    const record = await this.record(user, type, id);
    return this.materialize(
      user,
      type,
      id,
      record.label,
      { ...query, siteId: record.siteId ?? query.siteId },
      true,
    );
  }
  async modules(
    user: RequestUser,
    type: ScopeType,
    id: string,
    query: Row = {},
  ) {
    const detail = await this.detail(user, type, id, query);
    return detail.moduleScorecards;
  }
  async kpis(user: RequestUser, type: ScopeType, id: string, query: Row = {}) {
    const detail = await this.detail(user, type, id, query);
    return detail.kpiScorecards;
  }
  async items(
    user: RequestUser,
    type: ScopeType,
    id: string,
    kind:
      | "critical-alerts"
      | "overdue-actions"
      | "pending-approvals"
      | "stale-records"
      | "source-trace",
    query: Row = {},
  ) {
    const detail = await this.detail(user, type, id, query);
    if (kind === "source-trace") {
      this.require(user, "executive.performance.source_trace.view");
      return detail.sourceTrace;
    }
    const key =
      kind === "critical-alerts"
        ? "criticalItems"
        : kind === "overdue-actions"
          ? "overdueItems"
          : kind === "pending-approvals"
            ? "pendingApprovals"
            : "staleRecords";
    return detail.moduleScorecards.flatMap((row: Row) =>
      Array.isArray(row.source_trace_json?.[key])
        ? row.source_trace_json[key]
        : [],
    );
  }
  async recalculate(user: RequestUser, input: Row = {}) {
    this.require(user, "executive.performance.recalculate");
    const result = await this.aggregation.run(user, {
      ...input,
      runType: "Performance Recalculation",
    });
    await this.history(
      user,
      "EXECUTIVE_PERFORMANCE_RECALCULATED",
      "Executive performance recalculated",
      null,
      { scope: input, aggregationRunId: result.run.id },
    );
    return result;
  }
  async compare(user: RequestUser, query: Row = {}) {
    this.require(user, "executive.performance.compare.view");
    const type = this.scopeType(query.scopeType);
    const result = await this.scopes(user, type, query);
    const set = {
      id: crypto.randomUUID(),
      company_id: user.tenantId,
      site_id: query.siteId ?? null,
      comparison_title: query.title ?? `${type} performance comparison`,
      comparison_type: query.comparisonType ?? "Performance Score",
      scope_type: type,
      filter_json: query,
      included_scope_count: result.total,
      excluded_scope_count: 0,
      comparison_method_json: {
        source: "latest permitted scope performance results",
      },
      generated_by: user.id,
      generated_at: new Date().toISOString(),
    };
    const saved = await this.db.single<Row>(
      this.db
        .from("executive_performance_comparison_sets")
        .insert(set)
        .select("*")
        .single(),
    );
    const rankings = result.rows.map((row: Row, index: number) => ({
      id: crypto.randomUUID(),
      company_id: user.tenantId,
      site_id: row.site_id,
      comparison_set_id: saved.id,
      ranking_type: set.comparison_type,
      scope_type: type,
      scope_record_id: row.scope_record_id,
      scope_label: row.scope_label,
      rank_position: index + 1,
      ranking_value: row.performance_score_foundation,
      ranking_status: row.performance_status,
      ranking_reason: row.data_quality_status,
      source_trace_json: row.source_trace_json,
      generated_at: new Date().toISOString(),
    }));
    if (rankings.length)
      await this.db.many(
        this.db
          .from("executive_performance_rankings")
          .insert(rankings)
          .select("id"),
      );
    await this.history(
      user,
      "EXECUTIVE_PERFORMANCE_COMPARED",
      "Executive performance comparison generated",
      null,
      { comparisonSetId: saved.id },
    );
    return { comparison: saved, rows: result.rows, rankings };
  }
  async heatmap(user: RequestUser, query: Row = {}) {
    this.require(user, "executive.performance.heatmap.view");
    const compared = await this.compare(user, {
      ...query,
      comparisonType: "Heatmap",
    });
    const cells = compared.rows.flatMap((row: Row) =>
      (row.moduleScorecards as Row[]).map((module) => ({
        id: crypto.randomUUID(),
        company_id: user.tenantId,
        site_id: row.site_id,
        comparison_set_id: compared.comparison.id,
        row_scope_type: row.scope_type,
        row_scope_record_id: row.scope_record_id,
        row_label: row.scope_label,
        column_key: module.module_key,
        column_label: module.module_label,
        cell_value: module.module_health_score_foundation,
        cell_text_value: module.module_health_status,
        cell_status: module.module_health_status,
        source_module: module.module_key,
        source_trace_json: this.can(
          user,
          "executive.performance.restricted_trace.view",
        )
          ? module.source_trace_json
          : null,
        restricted: Number(module.restricted_record_count ?? 0) > 0,
        unavailable: module.module_health_status === "unavailable",
        insufficient_data: module.module_health_status === "incomplete_data",
        generated_at: new Date().toISOString(),
      })),
    );
    if (cells.length)
      await this.db.many(
        this.db
          .from("executive_performance_heatmap_cells")
          .insert(cells)
          .select("id"),
      );
    return { comparison: compared.comparison, cells };
  }
  async rankings(user: RequestUser, query: Row = {}) {
    this.require(user, "executive.performance.ranking.view");
    return this.compare(user, {
      ...query,
      comparisonType: query.rankingType ?? "Performance Score",
    });
  }
  async drilldown(user: RequestUser, query: Row = {}) {
    this.require(user, "executive.performance.drilldown.view");
    const type = this.scopeType(query.scopeType);
    const id = query.scopeId ? String(query.scopeId) : null;
    if (!id && type !== "company")
      throw new BadRequestException("scopeId is required for this drilldown.");
    const detail =
      type === "company"
        ? await this.company(user, query)
        : await this.detail(user, type, id!, query);
    const children = await this.children(user, type, id, query);
    return {
      scope: detail,
      children,
      sourceTrace: this.can(user, "executive.performance.source_trace.view")
        ? detail.sourceTrace
        : [],
    };
  }
  async snapshots(user: RequestUser, query: Row = {}) {
    this.require(user, "executive.performance.snapshot.view");
    let request: any = this.db
      .from("executive_performance_snapshots")
      .select("*", { count: "exact" })
      .eq("company_id", user.tenantId)
      .is("archived_at", null)
      .order("generated_at", { ascending: false });
    if (query.siteId) request = request.eq("site_id", query.siteId);
    const { data, count, error } = await request.range(
      Number(query.offset ?? 0),
      Number(query.offset ?? 0) + Math.min(100, Number(query.limit ?? 50)) - 1,
    );
    if (error)
      throw new BadRequestException(
        "Performance snapshots are unavailable. Apply the Executive KPI Phase 3 migration.",
      );
    return { rows: data ?? [], total: count ?? 0 };
  }
  async snapshot(user: RequestUser, input: Row = {}) {
    this.require(user, "executive.performance.snapshot.create");
    const type = this.scopeType(input.scopeType);
    const id = input.scopeId ? String(input.scopeId) : null;
    const performance =
      type === "company"
        ? await this.company(user, input)
        : await this.detail(user, type, id!, input);
    const saved = await this.db.single<Row>(
      this.db
        .from("executive_performance_snapshots")
        .insert({
          id: crypto.randomUUID(),
          company_id: user.tenantId,
          site_id: performance.site_id ?? null,
          department_id: performance.department_id ?? null,
          unit_id: performance.unit_id ?? null,
          area_id: performance.area_id ?? null,
          equipment_id: performance.equipment_id ?? null,
          snapshot_code: `EPS-${new Date().getFullYear()}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
          snapshot_title:
            input.title ?? `${performance.scope_label} performance snapshot`,
          snapshot_type: input.snapshotType ?? "Manual",
          scope_type: type,
          scope_record_id: id,
          aggregation_run_id: performance.aggregation_run_id,
          date_range_start: input.dateRangeStart ?? null,
          date_range_end: input.dateRangeEnd ?? null,
          performance_score_foundation:
            performance.performance_score_foundation,
          performance_status: performance.performance_status,
          data_quality_status: performance.data_quality_status,
          included_modules_json: performance.included_modules_json,
          excluded_modules_json: performance.excluded_modules_json,
          restricted_modules_json: performance.restricted_modules_json,
          score_summary_json: {
            score: performance.performance_score_foundation,
            status: performance.performance_status,
          },
          kpi_summary_json: performance.kpi_summary_json,
          critical_alert_summary_json: {
            count: performance.critical_alert_count,
          },
          overdue_action_summary_json: {
            count: performance.overdue_action_count,
          },
          pending_approval_summary_json: {
            count: performance.pending_approval_count,
          },
          stale_record_summary_json: { count: performance.stale_record_count },
          source_count: Number((performance as Row).source_count ?? 0),
          calculation_method_snapshot_json:
            performance.calculation_method_snapshot_json,
          generated_by: user.id,
          generated_at: new Date().toISOString(),
          stale_status: performance.data_quality_status,
          stale_reason: performance.reason ?? null,
        })
        .select("*")
        .single(),
    );
    await this.history(
      user,
      "EXECUTIVE_PERFORMANCE_SNAPSHOT_CREATED",
      "Executive performance snapshot created",
      saved.id,
      { snapshot: saved },
    );
    return saved;
  }
  async snapshotDetail(user: RequestUser, id: string) {
    this.require(user, "executive.performance.snapshot.view");
    const row = await this.db.single<Row>(
      this.db
        .from("executive_performance_snapshots")
        .select("*")
        .eq("id", id)
        .eq("company_id", user.tenantId)
        .maybeSingle(),
    );
    if (!row || !this.allowed(user, row.site_id))
      throw new NotFoundException("Performance snapshot was not found.");
    return row;
  }
  async archiveSnapshot(user: RequestUser, id: string, input: Row) {
    this.require(user, "executive.performance.snapshot.archive");
    if (!String(input.reason ?? "").trim())
      throw new BadRequestException("Archive reason is required.");
    const saved = await this.db.single<Row>(
      this.db
        .from("executive_performance_snapshots")
        .update({
          archived_at: new Date().toISOString(),
          archived_by: user.id,
          archive_reason: input.reason,
        })
        .eq("id", id)
        .eq("company_id", user.tenantId)
        .select("*")
        .single(),
    );
    await this.history(
      user,
      "EXECUTIVE_PERFORMANCE_SNAPSHOT_ARCHIVED",
      "Executive performance snapshot archived",
      id,
      { reason: input.reason },
    );
    return saved;
  }
  lookups() {
    return {
      "performance-scope-types": [
        "company",
        "site",
        "department",
        "unit",
        "area",
        "equipment",
      ],
      "performance-statuses": [
        "Healthy",
        "Monitor",
        "Attention Required",
        "High Risk",
        "Critical",
        "Incomplete Data",
        "Unavailable",
        "Restricted",
      ],
      "performance-comparison-types": [
        "Performance Score",
        "Critical Alerts",
        "Overdue Actions",
        "Data Quality",
        "Heatmap",
      ],
      "performance-ranking-types": [
        "Performance Score",
        "Critical Alerts",
        "Overdue Actions",
        "Data Quality",
      ],
      "heatmap-cell-statuses": [
        "healthy",
        "monitor",
        "attention_required",
        "high_risk",
        "critical",
        "incomplete_data",
        "unavailable",
        "restricted",
      ],
    };
  }

  private async materialize(
    user: RequestUser,
    type: ScopeType,
    id: string | null,
    label: string,
    query: Row,
    persist: boolean,
  ) {
    const siteId =
      type === "site"
        ? id
        : (query.siteId ??
          (type === "company" ? user.selectedSiteId : null) ??
          null);
    if (siteId && !this.allowed(user, siteId))
      throw new ForbiddenException(
        "Selected scope is outside your assigned site access.",
      );
    const run = await this.latestRun(user, {
      siteId,
      unitId: type === "unit" ? id : (query.unitId ?? null),
      areaId: type === "area" ? id : (query.areaId ?? null),
      equipmentId: type === "equipment" ? id : (query.equipmentId ?? null),
    });
    const modules = run
      ? await this.db.many<Row>(
          this.db
            .from("executive_module_health_results")
            .select("*")
            .eq("company_id", user.tenantId)
            .eq("aggregation_run_id", run.id),
        )
      : [];
    const score = this.average(modules);
    const status =
      score === null
        ? run
          ? "Incomplete Data"
          : "Unavailable"
        : this.status(score);
    const record = {
      id: crypto.randomUUID(),
      company_id: user.tenantId,
      site_id: siteId,
      department_id: type === "department" ? id : null,
      unit_id: type === "unit" ? id : null,
      area_id: type === "area" ? id : null,
      equipment_id: type === "equipment" ? id : null,
      scope_type: type,
      scope_record_id: id,
      scope_label: label,
      aggregation_run_id: run?.id ?? null,
      performance_score_foundation: score,
      performance_status: status,
      data_quality_status: run
        ? modules.some((m) =>
            ["unavailable", "permission_restricted"].includes(m.adapter_status),
          )
          ? "Partial"
          : "Current"
        : "No Aggregation",
      critical_alert_count: modules.reduce(
        (n, m) => n + Number(m.critical_item_count ?? 0),
        0,
      ),
      high_risk_item_count: modules.reduce(
        (n, m) => n + Number(m.high_risk_item_count ?? 0),
        0,
      ),
      overdue_action_count: modules.reduce(
        (n, m) => n + Number(m.overdue_item_count ?? 0),
        0,
      ),
      pending_approval_count: modules.reduce(
        (n, m) => n + Number(m.pending_approval_count ?? 0),
        0,
      ),
      stale_record_count: modules.reduce(
        (n, m) => n + Number(m.stale_record_count ?? 0),
        0,
      ),
      restricted_record_count: modules.reduce(
        (n, m) => n + Number(m.restricted_record_count ?? 0),
        0,
      ),
      unavailable_module_count: modules.filter(
        (m) => m.adapter_status === "unavailable",
      ).length,
      insufficient_data_count: modules.filter(
        (m) => m.module_health_status === "incomplete_data",
      ).length,
      included_modules_json: modules
        .filter((m) =>
          ["connected", "connected_with_warnings", "no_data"].includes(
            m.adapter_status,
          ),
        )
        .map((m) => m.module_key),
      excluded_modules_json: modules
        .filter((m) => m.adapter_status === "unavailable")
        .map((m) => m.module_key),
      restricted_modules_json: modules
        .filter((m) => m.adapter_status === "permission_restricted")
        .map((m) => m.module_key),
      module_score_summary_json: modules.map((m) => ({
        moduleKey: m.module_key,
        score: m.health_score_foundation,
        status: m.module_health_status,
      })),
      kpi_summary_json: { moduleCount: modules.length },
      calculation_method_snapshot_json: {
        source: "Executive KPI Phase 2 latest permitted aggregation run",
        aggregationRunId: run?.id ?? null,
      },
      source_trace_json: this.can(
        user,
        "executive.performance.restricted_trace.view",
      )
        ? modules.map((m) => m.source_trace_json)
        : null,
      calculated_by: user.id,
      calculated_at: new Date().toISOString(),
    };
    if (persist) {
      let previous: any = this.db
        .from("executive_scope_performance_results")
        .delete()
        .eq("company_id", user.tenantId)
        .eq("scope_type", type);
      previous = id
        ? previous.eq("scope_record_id", id)
        : previous.is("scope_record_id", null);
      await previous;
      await this.db.single(
        this.db
          .from("executive_scope_performance_results")
          .insert(record)
          .select("id")
          .single(),
      );
    }
    return {
      ...record,
      moduleScorecards: modules,
      kpiScorecards: [],
      sourceTrace: this.can(user, "executive.performance.source_trace.view")
        ? await this.traces(user, run?.id)
        : [],
      reason: run
        ? null
        : "No completed Phase 2 aggregation exists for this permitted scope. Run a performance recalculation to produce results.",
    };
  }
  private async records(user: RequestUser, type: ScopeType, query: Row) {
    const table = (
      {
        site: "Site",
        department: "Department",
        unit: "Unit",
        area: "Area",
        equipment: "Equipment",
      } as Record<string, string>
    )[type];
    if (!table) return [];
    const rows = await this.db
      .many<Row>(
        this.db
          .from(table)
          .select("*")
          .eq(
            type === "site" ||
              type === "unit" ||
              type === "area" ||
              type === "equipment"
              ? "tenantId"
              : "tenantId",
            user.tenantId,
          ),
      )
      .catch(() => []);
    return rows
      .filter((row) => {
        const siteId =
          type === "site" ? row.id : (row.siteId ?? query.siteId ?? null);
        return (
          this.allowed(user, siteId) &&
          (!query.siteId || siteId === query.siteId)
        );
      })
      .map((row) => ({
        id: row.id,
        label: row.name ?? row.tag ?? row.code ?? row.id,
        siteId: type === "site" ? row.id : (row.siteId ?? query.siteId ?? null),
      }));
  }
  private async record(user: RequestUser, type: ScopeType, id: string) {
    const all = await this.records(user, type, {});
    const row = all.find((item) => item.id === id);
    if (!row)
      throw new NotFoundException("Permitted performance scope was not found.");
    return row;
  }
  private async children(
    user: RequestUser,
    type: ScopeType,
    id: string | null,
    query: Row,
  ) {
    const next: Partial<Record<ScopeType, ScopeType>> = {
      company: "site",
      site: "unit",
      unit: "area",
      area: "equipment",
    };
    const child = next[type];
    if (!child) return [];
    const rows = await this.records(user, child, {
      ...query,
      siteId: type === "site" ? id : query.siteId,
    });
    return rows.map((row) => ({
      parent_scope_type: type,
      parent_scope_record_id: id,
      child_scope_type: child,
      child_scope_record_id: row.id,
      child_label: row.label,
      drilldown_route: `/executive/performance/${child}s/${row.id}`,
      restricted: false,
      permission_required: `executive.performance.${child}.view`,
    }));
  }
  private async latestRun(user: RequestUser, scope: Row) {
    let query: any = this.db
      .from("executive_kpi_aggregation_runs")
      .select("*")
      .eq("company_id", user.tenantId)
      .in("run_status", ["Completed", "Completed With Warnings"])
      .order("completed_at", { ascending: false })
      .limit(1);
    for (const [column, value] of Object.entries({
      site_id: scope.siteId,
      unit_id: scope.unitId,
      area_id: scope.areaId,
      equipment_id: scope.equipmentId,
    }))
      query = value ? query.eq(column, value) : query.is(column, null);
    return this.db.single<Row>(query.maybeSingle()).catch(() => null);
  }
  private async traces(user: RequestUser, runId?: string) {
    if (!runId) return [];
    const rows = await this.db.many<Row>(
      this.db
        .from("executive_kpi_source_records")
        .select("*")
        .eq("company_id", user.tenantId)
        .eq("aggregation_run_id", runId),
    );
    return this.can(user, "executive.performance.restricted_trace.view")
      ? rows
      : rows.map((row) =>
          row.restricted
            ? { ...row, source_record_id: null, source_snapshot_json: null }
            : row,
        );
  }
  private scopeType(value: unknown): ScopeType {
    const valueString = String(value ?? "site") as ScopeType;
    if (
      !["company", "site", "department", "unit", "area", "equipment"].includes(
        valueString,
      )
    )
      throw new BadRequestException("Invalid performance scope type.");
    return valueString;
  }
  private average(rows: Row[]) {
    const values = rows
      .map((row) => Number(row.health_score_foundation))
      .filter(Number.isFinite);
    return values.length
      ? Math.round(values.reduce((a, b) => a + b, 0) / values.length)
      : null;
  }
  private status(score: number) {
    return score < 40
      ? "Critical"
      : score < 60
        ? "High Risk"
        : score < 75
          ? "Attention Required"
          : score < 90
            ? "Monitor"
            : "Healthy";
  }
  private allowed(user: RequestUser, siteId?: string | null) {
    return (
      !siteId ||
      Boolean(
        user.corporateView ||
        user.isCompanyAdmin ||
        user.isSuperAdmin ||
        user.siteIds.includes(siteId),
      )
    );
  }
  private can(user: RequestUser, key: string) {
    return Boolean(
      user.isCompanyAdmin ||
      user.isSuperAdmin ||
      user.permissions.includes(key),
    );
  }
  private require(user: RequestUser, key: string) {
    if (!this.can(user, key))
      throw new ForbiddenException(`Missing required permission: ${key}`);
  }
  private async history(
    user: RequestUser,
    event: string,
    title: string,
    entityId: string | null,
    after: Row,
  ) {
    await this.audit
      .write({
        tenantId: user.tenantId,
        actorId: user.id,
        action: event,
        entityType: "ExecutivePerformance",
        entityId: entityId ?? user.tenantId,
        after,
        metadata: { sourceModule: "Executive KPI Dashboard Phase 3" },
      })
      .catch(() => null);
    await this.db
      .single(
        this.db
          .from("executive_performance_history_events")
          .insert({
            id: crypto.randomUUID(),
            company_id: user.tenantId,
            site_id: user.selectedSiteId ?? null,
            event_type: event,
            event_title: title,
            after_value_json: after,
            actor_user_id: user.id,
            source_module: "Executive KPI Dashboard",
            source_record_id: entityId,
          })
          .select("id")
          .single(),
      )
      .catch(() => null);
  }
}
