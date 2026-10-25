import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { AuditService } from "../audit/audit.service";
import { RequestUser } from "../common/decorators/current-user.decorator";
import { SupabaseService } from "../database/supabase.service";
import { ExecutiveAdapterRegistryService } from "./executive-adapter-registry.service";
import {
  ExecutiveModuleAdapterResult,
  ExecutiveScope,
} from "./executive-adapter-contract.service";
import { ExecutivePsmElementService } from "./executive-psm-element.service";

type Row = Record<string, any>;

@Injectable()
export class ExecutiveAggregationService {
  constructor(
    private readonly db: SupabaseService,
    private readonly audit: AuditService,
    private readonly registry: ExecutiveAdapterRegistryService,
    private readonly psmElements: ExecutivePsmElementService,
  ) {}

  scope(user: RequestUser, input: Row = {}): ExecutiveScope {
    const siteId = (input.siteId ??
      input.site_id ??
      user.selectedSiteId ??
      null) as string | null;
    if (siteId && !this.siteAllowed(user, siteId))
      throw new ForbiddenException(
        "Selected site is outside your assigned scope.",
      );
    return {
      siteId,
      unitId: input.unitId ?? input.unit_id ?? null,
      areaId: input.areaId ?? input.area_id ?? null,
      equipmentId: input.equipmentId ?? input.equipment_id ?? null,
      dateRangeStart: input.dateRangeStart ?? input.date_range_start ?? null,
      dateRangeEnd: input.dateRangeEnd ?? input.date_range_end ?? null,
    };
  }

  async run(user: RequestUser, input: Row = {}) {
    this.require(user, "executive.aggregation.run");
    const scope = this.scope(user, input);
    const started = new Date().toISOString();
    const run = await this.db.single<Row>(
      this.db
        .from("executive_kpi_aggregation_runs")
        .insert({
          id: crypto.randomUUID(),
          company_id: user.tenantId,
          site_id: scope.siteId,
          unit_id: scope.unitId,
          area_id: scope.areaId,
          equipment_id: scope.equipmentId,
          run_code: `EKAR-${new Date().getFullYear()}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
          run_type: input.runType ?? "Manual",
          run_status: "Running",
          scope_json: scope,
          date_range_start: scope.dateRangeStart,
          date_range_end: scope.dateRangeEnd,
          generated_by: user.id,
          started_at: started,
        })
        .select("*")
        .single(),
    );
    try {
      const adapters = await this.registry.aggregateAll(user, scope);
      const persisted = await this.persist(user, run.id, scope, adapters);
      const status = adapters.some((result) => result.adapterStatus === "error")
        ? "Completed With Warnings"
        : "Completed";
      const completed = await this.db.single<Row>(
        this.db
          .from("executive_kpi_aggregation_runs")
          .update({
            run_status: status,
            included_modules_json: persisted.included,
            excluded_modules_json: persisted.excluded,
            restricted_modules_json: persisted.restricted,
            source_count: persisted.sourceCount,
            restricted_count: persisted.restrictedCount,
            excluded_count: persisted.excludedCount,
            warning_count: persisted.warningCount,
            error_count: persisted.errorCount,
            duration_ms: Date.now() - new Date(started).getTime(),
            completed_at: new Date().toISOString(),
          })
          .eq("id", run.id)
          .eq("company_id", user.tenantId)
          .select("*")
          .single(),
      );
      await this.psmElements
        .refreshAfterAggregation(user, scope)
        .catch(() => []);
      await this.history(
        user,
        "EXECUTIVE_AGGREGATION_COMPLETED",
        "Executive cross-module aggregation completed",
        completed.id,
        { adapterCount: adapters.length, runStatus: status },
      );
      return this.detail(user, completed.id);
    } catch {
      await this.db
        .single(
          this.db
            .from("executive_kpi_aggregation_runs")
            .update({
              run_status: "Failed",
              failed_at: new Date().toISOString(),
              safe_error_summary:
                "The aggregation could not complete. Source-specific details are available only to authorized users.",
            })
            .eq("id", run.id)
            .eq("company_id", user.tenantId)
            .select("*")
            .single(),
        )
        .catch(() => null);
      await this.history(
        user,
        "EXECUTIVE_AGGREGATION_FAILED",
        "Executive cross-module aggregation failed safely",
        run.id,
        null,
      );
      throw new BadRequestException(
        "Aggregation could not complete. No partial dashboard value was presented as current.",
      );
    }
  }

  async dashboard(user: RequestUser, input: Row = {}) {
    const scope = this.scope(user, input);
    const run = await this.latest(user, scope);
    if (!run)
      return {
        header: {
          companyId: user.tenantId,
          selectedSiteId: scope.siteId,
          lastAggregationRun: null,
          status: "Incomplete Data",
          score: null,
          reason: "No aggregation run is available for the selected scope.",
          stale: true,
        },
        summaryCards: [],
        moduleHealth: [],
        criticalAlerts: [],
        sitePerformance: [],
        sourceHealth: [],
        openCriticalActions: [],
        pendingApprovals: [],
        staleRecords: [],
        regulatoryAuditCompliance: [],
        incidentMiTraining: [],
        managementReview: [],
        recentSnapshot: null,
        aggregationWarning:
          "Run aggregation to obtain current executive results.",
      };
    const detail = await this.detail(user, run.id);
    return { ...detail.dashboard, latestRun: detail.run };
  }
  async dashboardSummary(user: RequestUser, input: Row = {}) {
    return (await this.dashboard(user, input)).header;
  }
  async dashboardView(user: RequestUser, view: string, input: Row = {}) {
    const dashboard = await this.dashboard(user, input);
    return (
      (
        {
          "critical-alerts": dashboard.criticalAlerts,
          "module-health": dashboard.moduleHealth,
          "site-performance": dashboard.sitePerformance,
          "source-health": dashboard.sourceHealth,
        } as Row
      )[view] ?? dashboard
    );
  }
  async runs(user: RequestUser, input: Row = {}) {
    this.require(user, "executive.aggregation.history.view");
    const scope = this.scope(user, input);
    let query: any = this.db
      .from("executive_kpi_aggregation_runs")
      .select("*", { count: "exact" })
      .eq("company_id", user.tenantId)
      .order("started_at", { ascending: false });
    if (scope.siteId) query = query.eq("site_id", scope.siteId);
    const { data, count, error } = await query.range(
      Number(input.offset ?? 0),
      Number(input.offset ?? 0) + Math.min(Number(input.limit ?? 50), 100) - 1,
    );
    if (error)
      throw new BadRequestException(
        "Aggregation history is unavailable. Apply the Executive Phase 2 migration.",
      );
    return { rows: data ?? [], total: count ?? 0 };
  }
  async archiveRun(user: RequestUser, id: string, input: Row) {
    this.require(user, "executive.aggregation.history.view");
    if (!String(input.reason ?? "").trim())
      throw new BadRequestException("Archive reason is required.");
    const before = await this.runRecord(user, id);
    const after = await this.db.single<Row>(
      this.db
        .from("executive_kpi_aggregation_runs")
        .update({
          run_status: "Archived",
          safe_error_summary: `Archived: ${input.reason}`,
        })
        .eq("id", id)
        .eq("company_id", user.tenantId)
        .select("*")
        .single(),
    );
    await this.history(
      user,
      "EXECUTIVE_AGGREGATION_ARCHIVED",
      "Executive aggregation run archived",
      id,
      { before, after, reason: input.reason },
    );
    return after;
  }
  async detail(user: RequestUser, runId: string) {
    this.require(user, "executive.aggregation.history.view");
    const run = await this.runRecord(user, runId);
    const [moduleHealth, alerts, traces, errors] = await Promise.all([
      this.rows(user, "executive_module_health_results", runId),
      this.rows(user, "executive_critical_alerts", runId),
      this.rows(user, "executive_kpi_source_records", runId),
      this.rows(user, "executive_aggregation_errors", runId),
    ]);
    const sitePerformance = await this.sitePerformanceFromResults(
      user,
      run.site_id ?? null,
    );
    const scoreRows = moduleHealth.filter(
      (row) => typeof row.health_score_foundation === "number",
    );
    const score = scoreRows.length
      ? Math.round(
          scoreRows.reduce(
            (sum, row) => sum + Number(row.health_score_foundation),
            0,
          ) / scoreRows.length,
        )
      : null;
    const summaryCards = moduleHealth.map((row) => this.publicSummaryCard(row));
    const criticalAlerts = alerts.map((row) => this.publicAlert(row));
    const attentionRows = (key: string, status: string) =>
      moduleHealth.flatMap((row) =>
        this.sourceItems(row.source_trace_json, key).map((item) =>
          this.publicAttentionItem(row, item, status),
        ),
      );
    const openCriticalActions = attentionRows("overdueItems", "Warning");
    const pendingApprovals = attentionRows("pendingApprovals", "Monitor");
    const staleRecords = attentionRows("staleRecords", "Warning");
    const matchesModule = (row: Row, pattern: RegExp) =>
      pattern.test(String(row.sourceModule ?? ""));
    return {
      run,
      moduleHealth,
      criticalAlerts: alerts,
      sourceRecords: traces,
      errors: this.can(user, "executive.aggregation_error.view") ? errors : [],
      dashboard: {
        header: {
          companyId: user.tenantId,
          selectedSiteId: run.site_id,
          lastAggregationRun: run.completed_at ?? run.started_at,
          score,
          status: score === null ? "Incomplete Data" : this.scoreStatus(score),
          reason:
            score === null
              ? "Not enough permitted, connected modules produced a health score."
              : null,
          stale:
            !run.completed_at ||
            Date.now() - new Date(run.completed_at).getTime() > 15 * 60 * 1000,
          criticalAlertsCount: criticalAlerts.length,
          overdueActionCount: openCriticalActions.length,
          staleCriticalRecordCount: staleRecords.length,
          pendingApprovalCount: pendingApprovals.length,
          dataQualityStatus: moduleHealth.some(
            (row) => row.adapter_status === "error",
          )
            ? "Error"
            : moduleHealth.some((row) =>
                  ["unavailable", "connected_with_warnings"].includes(
                    row.adapter_status,
                  ),
                )
              ? "Connected With Warnings"
              : moduleHealth.some(
                    (row) => row.adapter_status === "permission_restricted",
                  )
                ? "Permission Restricted"
                : "Connected",
        },
        summaryCards,
        moduleHealth: moduleHealth.map((row) => this.publicModuleHealth(row)),
        criticalAlerts,
        sitePerformance,
        openCriticalActions,
        pendingApprovals,
        staleRecords,
        regulatoryAuditCompliance: summaryCards.filter((row) =>
          matchesModule(row, /regulatory|audit|compliance/i),
        ),
        incidentMiTraining: summaryCards.filter((row) =>
          matchesModule(row, /incident|integrity|training|competency/i),
        ),
        managementReview: summaryCards.filter((row) =>
          matchesModule(row, /management.?review/i),
        ),
        sourceHealth: moduleHealth.map((row) => ({
          sourceModule: row.module_key,
          title: row.module_label,
          adapterStatus: this.displayStatus(row.adapter_status),
          lastCheckedAt: row.calculated_at,
          lastSuccessAt: ["connected", "connected_with_warnings"].includes(
            row.adapter_status,
          )
            ? row.calculated_at
            : null,
          recordsIncluded: Math.max(
            0,
            Number(row.critical_item_count ?? 0) +
              Number(row.overdue_item_count ?? 0) +
              Number(row.stale_record_count ?? 0),
          ),
          restrictedRecords: row.restricted_record_count,
          warningCount: row.warning_count,
          errorCount: row.error_count,
          safeErrorMessage:
            row.adapter_status === "unavailable"
              ? "Source unavailable in this deployment."
              : null,
          route: null,
        })),
        recentSnapshot: null,
      },
    };
  }
  async moduleHealth(user: RequestUser, input: Row = {}) {
    this.require(user, "executive.module_health.view");
    const latest = await this.latest(user, this.scope(user, input));
    if (!latest) return [];
    return (
      await this.rows(user, "executive_module_health_results", latest.id)
    ).map((row) => this.publicModuleHealth(row));
  }
  async moduleDetail(user: RequestUser, key: string, input: Row = {}) {
    this.require(user, "executive.module_health.detail.view");
    const latest = await this.latest(user, this.scope(user, input));
    if (!latest)
      throw new NotFoundException("No aggregation run is available.");
    const row = (
      await this.rows(user, "executive_module_health_results", latest.id)
    ).find((item) => item.module_key === key);
    if (!row)
      throw new NotFoundException("Module health result was not found.");
    const traces = await this.rows(
      user,
      "executive_kpi_source_records",
      latest.id,
      key,
    );
    return {
      module: this.publicModuleHealth(row),
      criticalItems: this.sourceItems(row.source_trace_json, "criticalItems"),
      overdueItems: this.sourceItems(row.source_trace_json, "overdueItems"),
      pendingApprovals: this.sourceItems(
        row.source_trace_json,
        "pendingApprovals",
      ),
      staleRecords: this.sourceItems(row.source_trace_json, "staleRecords"),
      sourceTrace: this.maskTraces(user, traces),
      calculationMethod: row.calculation_method_snapshot_json ?? null,
    };
  }
  async recalculateModule(user: RequestUser, key: string, input: Row = {}) {
    this.require(user, "executive.module_health.recalculate");
    return this.run(user, {
      ...input,
      modules: [key],
      runType: "Module Recalculation",
    });
  }
  async alerts(user: RequestUser, input: Row = {}) {
    this.require(user, "executive.critical_alert.view");
    const latest = await this.latest(user, this.scope(user, input));
    return latest
      ? this.rows(user, "executive_critical_alerts", latest.id)
      : [];
  }
  async resolveAlert(user: RequestUser, id: string, input: Row) {
    this.require(user, "executive.critical_alert.resolve");
    if (!String(input.reason ?? "").trim())
      throw new BadRequestException("Resolution reason is required.");
    const before = await this.db.single<Row>(
      this.db
        .from("executive_critical_alerts")
        .select("*")
        .eq("id", id)
        .eq("company_id", user.tenantId)
        .maybeSingle(),
    );
    if (!before) throw new NotFoundException("Critical alert was not found.");
    const after = await this.db.single<Row>(
      this.db
        .from("executive_critical_alerts")
        .update({
          alert_status: "Resolved",
          resolved_at: new Date().toISOString(),
          resolved_by: user.id,
          resolution_note: input.reason,
        })
        .eq("id", id)
        .eq("company_id", user.tenantId)
        .select("*")
        .single(),
    );
    await this.history(
      user,
      "EXECUTIVE_ALERT_RESOLVED",
      "Executive critical alert resolved",
      id,
      { before, after },
    );
    return after;
  }
  async sourceConfigs(user: RequestUser) {
    this.require(user, "executive.source_config.view");
    return this.db.many<Row>(
      this.db
        .from("executive_module_source_configs")
        .select("*")
        .or(`company_id.is.null,company_id.eq.${user.tenantId}`)
        .is("archived_at", null)
        .order("module_label"),
    );
  }
  async updateSourceConfig(user: RequestUser, id: string, input: Row) {
    this.require(user, "executive.source_config.edit");
    const before = await this.db.single<Row>(
      this.db
        .from("executive_module_source_configs")
        .select("*")
        .eq("id", id)
        .or(`company_id.is.null,company_id.eq.${user.tenantId}`)
        .maybeSingle(),
    );
    if (!before)
      throw new NotFoundException("Source configuration was not found.");
    const fields = [
      "adapter_enabled",
      "include_in_overall_health",
      "default_weight",
      "critical_threshold_config_json",
      "stale_after_minutes",
      "active",
    ];
    const update = Object.fromEntries(
      fields
        .filter((field) => input[field] !== undefined)
        .map((field) => [field, input[field]]),
    );
    const after = await this.db.single<Row>(
      this.db
        .from("executive_module_source_configs")
        .update({
          ...update,
          updated_by: user.id,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select("*")
        .single(),
    );
    await this.history(
      user,
      "EXECUTIVE_SOURCE_CONFIG_UPDATED",
      "Executive source configuration updated",
      id,
      { before, after },
    );
    return after;
  }
  async aggregationErrors(user: RequestUser, input: Row = {}) {
    this.require(user, "executive.aggregation_error.view");
    const latest = await this.latest(user, this.scope(user, input));
    return latest
      ? this.rows(user, "executive_aggregation_errors", latest.id)
      : [];
  }
  async resolveError(user: RequestUser, id: string, input: Row) {
    this.require(user, "executive.aggregation_error.resolve");
    if (!String(input.reason ?? "").trim())
      throw new BadRequestException("Resolution reason is required.");
    const after = await this.db.single<Row>(
      this.db
        .from("executive_aggregation_errors")
        .update({
          resolved_at: new Date().toISOString(),
          resolved_by: user.id,
          resolution_note: input.reason,
        })
        .eq("id", id)
        .eq("company_id", user.tenantId)
        .select("*")
        .single(),
    );
    await this.history(
      user,
      "EXECUTIVE_AGGREGATION_ERROR_RESOLVED",
      "Executive aggregation error resolved",
      id,
      { after },
    );
    return after;
  }
  async sitePerformance(user: RequestUser, input: Row = {}) {
    this.require(user, "executive.site_performance.view");
    return this.sitePerformanceFromResults(
      user,
      this.scope(user, input).siteId,
    );
  }
  async unitPerformance(user: RequestUser, input: Row = {}) {
    this.require(user, "executive.unit_performance.view");
    const scope = this.scope(user, input);
    const latest = await this.latest(user, scope);
    if (!latest) return [];
    const rows = await this.rows(
      user,
      "executive_module_health_results",
      latest.id,
    );
    return [
      {
        unitId: scope.unitId,
        overallHealth: this.displayStatus(this.aggregateStatus(rows)),
        score: this.average(rows),
        moduleCount: rows.length,
        criticalItems: rows.reduce(
          (sum, row) => sum + Number(row.critical_item_count ?? 0),
          0,
        ),
        overdueItems: rows.reduce(
          (sum, row) => sum + Number(row.overdue_item_count ?? 0),
          0,
        ),
        staleRecords: rows.reduce(
          (sum, row) => sum + Number(row.stale_record_count ?? 0),
          0,
        ),
        status: scope.unitId
          ? "Scoped aggregate"
          : "Select a unit to request unit-level aggregation.",
      },
    ];
  }
  lookups() {
    return {
      "aggregation-run-statuses": [
        "Running",
        "Completed",
        "Completed With Warnings",
        "Failed",
        "Archived",
      ],
      "adapter-statuses": [
        "connected",
        "connected_with_warnings",
        "unavailable",
        "permission_restricted",
        "no_data",
        "error",
      ],
      "module-health-statuses": [
        "healthy",
        "monitor",
        "attention_required",
        "high_risk",
        "critical",
        "incomplete_data",
        "restricted",
        "unavailable",
      ],
      "critical-alert-severities": ["low", "medium", "high", "critical"],
      "source-modules": this.registry
        .definitions()
        .map((item) => ({ key: item.key, label: item.label })),
    };
  }

  private async persist(
    user: RequestUser,
    runId: string,
    scope: ExecutiveScope,
    adapters: ExecutiveModuleAdapterResult[],
  ) {
    const healthRows: Row[] = [];
    const alertRows: Row[] = [];
    const traceRows: Row[] = [];
    const errorRows: Row[] = [];
    for (const result of adapters) {
      const healthId = crypto.randomUUID();
      healthRows.push({
        id: healthId,
        company_id: user.tenantId,
        site_id: scope.siteId,
        unit_id: scope.unitId,
        module_key: result.moduleKey,
        module_label: result.moduleLabel,
        aggregation_run_id: runId,
        adapter_status: result.adapterStatus,
        module_health_status: result.moduleHealthStatus,
        health_score_foundation: result.healthScoreFoundation,
        critical_item_count: result.criticalItems.length,
        high_risk_item_count: result.criticalItems.filter(
          (item) => item.severity === "high",
        ).length,
        overdue_item_count: result.overdueItems.length,
        pending_approval_count: result.pendingApprovals.length,
        stale_record_count: result.staleRecords.length,
        restricted_record_count: result.metrics.reduce(
          (sum, metric) => sum + metric.restrictedCount,
          0,
        ),
        excluded_record_count: result.metrics.reduce(
          (sum, metric) => sum + metric.excludedCount,
          0,
        ),
        warning_count: result.warnings.length,
        error_count: result.errors.length,
        calculation_method_snapshot_json: {
          version: "phase-2",
          score:
            "100 minus critical, overdue, pending approval, and stale-record penalties",
        },
        source_trace_json: {
          criticalItems: result.criticalItems,
          overdueItems: result.overdueItems,
          pendingApprovals: result.pendingApprovals,
          staleRecords: result.staleRecords,
        },
        calculated_by: user.id,
        calculated_at: result.calculatedAt,
      });
      for (const item of result.criticalItems)
        alertRows.push({
          id: crypto.randomUUID(),
          company_id: user.tenantId,
          site_id: item.siteId ?? scope.siteId,
          unit_id: item.unitId ?? scope.unitId,
          aggregation_run_id: runId,
          alert_code: `${result.moduleKey}:${item.sourceRecordId}`,
          alert_title: item.title,
          source_module: result.moduleKey,
          source_record_type: item.sourceRecordType,
          source_record_id: item.sourceRecordId,
          severity: item.severity,
          criticality: item.criticality,
          alert_status: "Open",
          alert_reason:
            "Critical or high-risk source record returned by adapter.",
          ranking_score: this.rank(item),
          owner_user_id: item.ownerUserId,
          due_date: item.dueDate,
          age_days: item.ageDays,
          drilldown_route: item.drilldownRoute,
          restricted: item.restricted,
          safe_placeholder: item.safePlaceholder,
          source_snapshot_json: { status: item.status },
        });
      for (const trace of result.sourceTrace)
        traceRows.push({
          id: crypto.randomUUID(),
          company_id: user.tenantId,
          site_id: scope.siteId,
          unit_id: scope.unitId,
          aggregation_run_id: runId,
          module_health_result_id: healthId,
          kpi_code: trace.metricCode,
          source_module: trace.sourceModule,
          source_record_type: trace.sourceRecordType,
          source_record_id: trace.sourceRecordId,
          included: trace.included,
          excluded_reason: trace.excludedReason,
          restricted: trace.restricted,
          contribution: trace.contribution,
          source_snapshot_json: trace.snapshot,
        });
      for (const error of result.errors)
        errorRows.push({
          id: crypto.randomUUID(),
          company_id: user.tenantId,
          site_id: scope.siteId,
          aggregation_run_id: runId,
          source_module: result.moduleKey,
          error_code: error.code,
          safe_error_message: error.safeMessage,
          error_severity:
            result.adapterStatus === "error" ? "Error" : "Warning",
          retryable: true,
          occurred_at: result.calculatedAt,
        });
    }
    if (healthRows.length)
      await this.db.many<Row>(
        this.db
          .from("executive_module_health_results")
          .insert(healthRows)
          .select("id"),
      );
    if (alertRows.length)
      await this.db.many<Row>(
        this.db
          .from("executive_critical_alerts")
          .insert(alertRows)
          .select("id"),
      );
    if (traceRows.length)
      await this.db.many<Row>(
        this.db
          .from("executive_kpi_source_records")
          .insert(traceRows)
          .select("id"),
      );
    if (errorRows.length)
      await this.db.many<Row>(
        this.db
          .from("executive_aggregation_errors")
          .insert(errorRows)
          .select("id"),
      );
    await this.persistKpiResults(user, runId, scope, adapters);
    return {
      included: adapters
        .filter((item) =>
          ["connected", "connected_with_warnings", "no_data"].includes(
            item.adapterStatus,
          ),
        )
        .map((item) => item.moduleKey),
      excluded: adapters
        .filter((item) => item.adapterStatus === "unavailable")
        .map((item) => item.moduleKey),
      restricted: adapters
        .filter((item) => item.adapterStatus === "permission_restricted")
        .map((item) => item.moduleKey),
      sourceCount: traceRows.length,
      restrictedCount: traceRows.filter((item) => item.restricted).length,
      excludedCount: traceRows.filter((item) => !item.included).length,
      warningCount: adapters.reduce(
        (sum, item) => sum + item.warnings.length,
        0,
      ),
      errorCount: errorRows.length,
    };
  }
  private async persistKpiResults(
    user: RequestUser,
    runId: string,
    scope: ExecutiveScope,
    adapters: ExecutiveModuleAdapterResult[],
  ) {
    const definitions = await this.db.many<Row>(
      this.db
        .from("executive_kpi_definitions")
        .select("*")
        .eq("active", true)
        .is("archived_at", null)
        .or(`company_id.is.null,company_id.eq.${user.tenantId}`),
    );
    if (!definitions.length) return;
    const rows = definitions.map((definition) => {
      const adapter = this.adapterForDefinition(definition, adapters);
      const metric = this.kpiMetric(definition.kpi_code, adapter, adapters);
      const unavailable =
        definition.source_module !== "Executive" &&
        (!adapter ||
          ["unavailable", "permission_restricted"].includes(
            adapter.adapterStatus,
          ));
      return {
        id: crypto.randomUUID(),
        company_id: user.tenantId,
        site_id: scope.siteId,
        department_id: null,
        unit_id: scope.unitId,
        area_id: scope.areaId,
        equipment_id: scope.equipmentId,
        kpi_definition_id: definition.id,
        kpi_code: definition.kpi_code,
        calculation_scope_json: { ...scope, aggregationRunId: runId },
        date_range_start: scope.dateRangeStart,
        date_range_end: scope.dateRangeEnd,
        kpi_value: metric.value,
        kpi_text_value: metric.value === null ? "Unavailable" : null,
        unit: definition.unit,
        numerator: metric.value,
        denominator: metric.denominator,
        score_foundation: metric.score,
        kpi_status: unavailable
          ? "Unavailable"
          : metric.value === null
            ? "Incomplete Data"
            : metric.status,
        threshold_status: unavailable
          ? "Unavailable"
          : metric.value === null
            ? "Incomplete Data"
            : metric.status,
        trend_status_foundation: null,
        confidence_status:
          adapter?.adapterStatus === "permission_restricted"
            ? "Restricted"
            : adapter?.adapterStatus === "unavailable"
              ? "Unavailable"
              : "Source aggregate",
        source_count: metric.denominator,
        excluded_count: 0,
        restricted_count:
          adapter?.adapterStatus === "permission_restricted" ? 1 : 0,
        error_count: adapter?.errors.length ?? 0,
        warning_count: adapter?.warnings.length ?? 0,
        source_trace_json: adapter ? { adapter: adapter.moduleKey, runId } : {},
        calculation_method_snapshot_json: {
          version: "phase-1-result-persistence",
          aggregationRunId: runId,
          sourceModule: definition.source_module,
        },
        calculated_by: user.id,
        calculated_at: new Date().toISOString(),
      };
    });
    await this.db.many<Row>(
      this.db.from("executive_kpi_results").insert(rows).select("id"),
    );
  }
  private adapterForDefinition(
    definition: Row,
    adapters: ExecutiveModuleAdapterResult[],
  ) {
    const aliases: Record<string, string> = {
      "action engine": "actions",
      audit: "audit",
      incident: "incidents",
      lopa: "lopa",
      "mechanical integrity": "mechanical-integrity",
      moc: "moc",
      pssr: "pssr",
      psi: "psi",
      ptw: "ptw",
      regulatory: "regulatory",
      reports: "reports",
      "review & approval": "review",
      training: "training",
      hazop: "hazop",
    };
    const key = aliases[String(definition.source_module ?? "").toLowerCase()];
    return key ? adapters.find((adapter) => adapter.moduleKey === key) : undefined;
  }
  private kpiMetric(
    code: string,
    adapter: ExecutiveModuleAdapterResult | undefined,
    adapters: ExecutiveModuleAdapterResult[],
  ) {
    if (
      adapter &&
      ["unavailable", "permission_restricted"].includes(
        adapter.adapterStatus,
      )
    )
      return { value: null, score: null, denominator: 0, status: "Unavailable" };
    const connected = adapters.filter((item) =>
      Number.isFinite(item.healthScoreFoundation),
    );
    const all = adapter ? [adapter] : connected;
    const count = (selector: (item: ExecutiveModuleAdapterResult) => number) =>
      all.reduce((sum, item) => sum + selector(item), 0);
    const health = all.length
      ? Math.round(
          count((item) => Number(item.healthScoreFoundation ?? 0)) / all.length,
        )
      : null;
    const normalized = String(code).toLowerCase();
    const value =
      normalized === "overall_psm_health_score"
        ? health
        : /critical|high_potential|non_compliant/.test(normalized)
          ? count((item) => item.criticalItems.length)
          : /overdue/.test(normalized)
            ? count((item) => item.overdueItems.length)
            : /pending/.test(normalized)
              ? count((item) => item.pendingApprovals.length)
              : /stale/.test(normalized)
                ? count((item) => item.staleRecords.length)
                : /compliance_percent|completeness_percent|readiness_percent|score_foundation/.test(
                      normalized,
                    )
                  ? health
                  : count(
                      (item) =>
                        item.metrics.find(
                          (metric) => metric.metricCode === "open_items",
                        )?.value ?? 0,
                    );
    const score =
      /percent|score|health/.test(normalized)
        ? value
        : value === null
          ? null
          : Math.max(0, 100 - Number(value) * 10);
    return {
      value,
      score,
      denominator: count(
        (item) =>
          item.metrics.find((metric) => metric.metricCode === "open_items")
            ?.denominator ?? 0,
      ),
      status:
        value === null
          ? "Incomplete Data"
          : score !== null && score < 40
            ? "Critical"
            : score !== null && score < 60
              ? "High Risk"
              : score !== null && score < 75
                ? "Attention Required"
                : "Current",
    };
  }
  private async latest(user: RequestUser, scope: ExecutiveScope) {
    let query: any = this.db
      .from("executive_kpi_aggregation_runs")
      .select("*")
      .eq("company_id", user.tenantId)
      .in("run_status", ["Completed", "Completed With Warnings"])
      .order("completed_at", { ascending: false })
      .limit(1);
    query = scope.siteId
      ? query.eq("site_id", scope.siteId)
      : query.is("site_id", null);
    return this.db.single<Row>(query.maybeSingle()).catch(() => null);
  }
  private async runRecord(user: RequestUser, id: string) {
    const run = await this.db.single<Row>(
      this.db
        .from("executive_kpi_aggregation_runs")
        .select("*")
        .eq("id", id)
        .eq("company_id", user.tenantId)
        .maybeSingle(),
    );
    if (!run || !this.siteAllowed(user, run.site_id))
      throw new NotFoundException("Aggregation run was not found.");
    return run;
  }
  private async rows(
    user: RequestUser,
    table: string,
    runId: string,
    moduleKey?: string,
  ) {
    let query: any = this.db
      .from(table)
      .select("*")
      .eq("company_id", user.tenantId)
      .eq("aggregation_run_id", runId);
    if (moduleKey)
      query = query.eq(
        table === "executive_kpi_source_records"
          ? "source_module"
          : "module_key",
        moduleKey,
      );
    return this.db.many<Row>(query).catch(() => []);
  }
  private async sitePerformanceFromResults(
    user: RequestUser,
    selectedSiteId: string | null,
  ) {
    const sites = await this.db
      .many<Row>(
        this.db
          .from("Site")
          .select("id,name,code")
          .eq("tenantId", user.tenantId),
      )
      .catch(() => []);
    const allowed = sites.filter(
      (site) =>
        this.siteAllowed(user, site.id) &&
        (!selectedSiteId || site.id === selectedSiteId),
    );
    if (!allowed.length) return [];

    const siteIds = allowed.map((site) => site.id);
    const runs = await this.db
      .many<Row>(
        this.db
          .from("executive_kpi_aggregation_runs")
          .select("*")
          .eq("company_id", user.tenantId)
          .in("site_id", siteIds)
          .in("run_status", ["Completed", "Completed With Warnings"])
          .order("completed_at", { ascending: false }),
      )
      .catch(() => []);
    const latestBySite = new Map<string, Row>();
    for (const run of runs)
      if (run.site_id && !latestBySite.has(run.site_id))
        latestBySite.set(run.site_id, run);
    const runIds = [...latestBySite.values()].map((run) => run.id);
    const healthRows = runIds.length
      ? await this.db
          .many<Row>(
            this.db
              .from("executive_module_health_results")
              .select("*")
              .eq("company_id", user.tenantId)
              .in("aggregation_run_id", runIds),
          )
          .catch(() => [])
      : [];
    const healthByRun = new Map<string, Row[]>();
    for (const row of healthRows)
      healthByRun.set(row.aggregation_run_id, [
        ...(healthByRun.get(row.aggregation_run_id) ?? []),
        row,
      ]);

    return allowed.map((site) => {
      const run = latestBySite.get(site.id);
      const rows = run ? (healthByRun.get(run.id) ?? []) : [];
      return {
        siteId: site.id,
        siteName: site.name ?? site.code ?? site.id,
        overallHealth: this.displayStatus(this.aggregateStatus(rows)),
        healthScoreFoundation: this.average(rows),
        criticalItems: rows.reduce(
          (sum, row) => sum + Number(row.critical_item_count ?? 0),
          0,
        ),
        overdueActions: rows.reduce(
          (sum, row) => sum + Number(row.overdue_item_count ?? 0),
          0,
        ),
        staleRecords: rows.reduce(
          (sum, row) => sum + Number(row.stale_record_count ?? 0),
          0,
        ),
        pendingReviews: rows.reduce(
          (sum, row) => sum + Number(row.pending_approval_count ?? 0),
          0,
        ),
        lastUpdated: run?.completed_at ?? null,
        route: `/executive/site-performance/${site.id}`,
      };
    });
  }
  private publicModuleHealth(row: Row) {
    return {
      moduleKey: row.module_key,
      moduleName: row.module_label,
      healthStatus: this.displayStatus(row.module_health_status),
      healthScoreFoundation: row.health_score_foundation,
      criticalOpenItems: row.critical_item_count,
      overdueItems: row.overdue_item_count,
      pendingApprovals: row.pending_approval_count,
      staleRecords: row.stale_record_count,
      lastUpdated: row.calculated_at,
      dataQuality: row.adapter_status,
      reason:
        row.adapter_status === "unavailable"
          ? "Source unavailable in this deployment."
          : row.adapter_status === "permission_restricted"
            ? "Restricted by source-module permission."
            : null,
      drilldownRoute: `/executive/module-health/${row.module_key}`,
    };
  }
  private publicSummaryCard(row: Row) {
    return {
      id: row.id,
      definitionId: row.id,
      kpiCode: `module_health:${row.module_key}`,
      title: row.module_label,
      category: "Module Health",
      sourceModule: row.module_key,
      displayValue:
        row.health_score_foundation ??
        (row.module_health_status === "restricted"
          ? "Restricted"
          : "Unavailable"),
      value: row.health_score_foundation,
      textValue: null,
      status: this.displayStatus(row.module_health_status),
      thresholdStatus: "Latest aggregation",
      trendStatus: "Not calculated",
      confidenceStatus: this.displayStatus(row.adapter_status),
      sourceCount:
        Number(row.critical_item_count ?? 0) +
        Number(row.overdue_item_count ?? 0),
      calculatedAt: row.calculated_at,
      drilldownRoute: `/executive/module-health/${row.module_key}`,
    };
  }
  private publicAlert(row: Row) {
    return {
      title: row.alert_title,
      sourceModule: row.source_module,
      sourceRecord: row.restricted ? null : row.source_record_id,
      severity: this.displayStatus(row.severity),
      owner: row.owner_user_id,
      dueDate: row.due_date,
      status: this.displayStatus(row.severity),
      rankingMethod: row.alert_reason,
      drilldownRoute: row.drilldown_route,
      message: row.alert_reason,
    };
  }
  private publicAttentionItem(module: Row, item: Row, status: string) {
    return {
      title: item.title ?? "Source record requiring attention",
      sourceModule: module.module_label ?? module.module_key,
      sourceRecord: item.restricted ? null : item.sourceRecordId,
      severity: this.displayStatus(
        String(item.severity ?? status)
          .toLowerCase()
          .replace(/\s+/g, "_"),
      ),
      owner: item.ownerUserId ?? null,
      dueDate: item.dueDate ?? null,
      status,
      rankingMethod: "Latest completed Executive aggregation",
      drilldownRoute: item.drilldownRoute ?? null,
      message: item.safePlaceholder ? "Restricted source record" : null,
    };
  }
  private sourceItems(snapshot: unknown, key: string) {
    return ((snapshot as Row | null)?.[key] as Row[] | undefined) ?? [];
  }
  private maskTraces(user: RequestUser, traces: Row[]) {
    return this.can(user, "executive.source_trace.restricted.view")
      ? traces
      : traces.map((trace) =>
          trace.restricted
            ? { ...trace, source_record_id: null, source_snapshot_json: null }
            : trace,
        );
  }
  private rank(item: Row) {
    return (
      (item.severity === "critical"
        ? 100
        : item.severity === "high"
          ? 70
          : 30) + Math.min(Number(item.ageDays ?? 0), 30)
    );
  }
  private average(rows: Row[]) {
    const values = rows
      .map((row) => Number(row.health_score_foundation))
      .filter(Number.isFinite);
    return values.length
      ? Math.round(
          values.reduce((sum, value) => sum + value, 0) / values.length,
        )
      : null;
  }
  private aggregateStatus(rows: Row[]) {
    const score = this.average(rows);
    if (score === null) return "incomplete_data";
    return score < 40
      ? "critical"
      : score < 60
        ? "high_risk"
        : score < 75
          ? "attention_required"
          : score < 90
            ? "monitor"
            : "healthy";
  }
  private scoreStatus(score: number) {
    return this.displayStatus(
      score < 40
        ? "critical"
        : score < 60
          ? "high_risk"
          : score < 75
            ? "attention_required"
            : score < 90
              ? "monitor"
              : "healthy",
    );
  }
  private displayStatus(value: string) {
    return (
      (
        {
          healthy: "Healthy",
          monitor: "Monitor",
          attention_required: "Attention Required",
          high: "High Risk",
          high_risk: "High Risk",
          critical: "Critical",
          warning: "Warning",
          incomplete_data: "Incomplete Data",
          restricted: "Restricted",
          unavailable: "Unavailable",
          connected: "Good",
          connected_with_warnings: "Warning",
          permission_restricted: "Restricted",
          no_data: "Incomplete Data",
          error: "Error",
        } as Record<string, string>
      )[value] ?? value
    );
  }
  private can(user: RequestUser, permission: string) {
    return Boolean(
      user.isCompanyAdmin ||
      user.isSuperAdmin ||
      user.permissions.includes(permission),
    );
  }
  private require(user: RequestUser, permission: string) {
    if (!this.can(user, permission))
      throw new ForbiddenException(
        `Missing required permission: ${permission}`,
      );
  }
  private siteAllowed(user: RequestUser, siteId?: string | null) {
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
  private async history(
    user: RequestUser,
    action: string,
    title: string,
    entityId: string,
    after: Row | null,
  ) {
    await this.audit
      .write({
        tenantId: user.tenantId,
        actorId: user.id,
        action,
        entityType: "ExecutiveAggregation",
        entityId,
        ...(after ? { after } : {}),
        metadata: { sourceModule: "Executive KPI Dashboard Phase 2" },
      })
      .catch(() => null);
    await this.db
      .single(
        this.db
          .from("executive_kpi_history_events")
          .insert({
            id: crypto.randomUUID(),
            company_id: user.tenantId,
            site_id: user.selectedSiteId ?? null,
            event_type: action,
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
