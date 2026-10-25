import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from "@nestjs/common";
import {
  CurrentUser,
  RequestUser,
} from "../common/decorators/current-user.decorator";
import { Permissions } from "../common/decorators/permissions.decorator";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { PermissionsGuard } from "../common/guards/permissions.guard";
import { SiteGuard } from "../common/guards/site.guard";
import { ExecutiveDashboardService } from "./executive-dashboard.service";
import { ExecutiveAggregationService } from "./executive-aggregation.service";
import { ExecutivePerformanceService } from "./executive-performance.service";
import { ExecutivePsmElementService } from "./executive-psm-element.service";
import { ExecutiveCriticalRiskService } from "./executive-critical-risk.service";
import { ExecutiveManagementReviewService } from "./executive-management-review.service";
import { ExecutiveTrendsService } from "./executive-trends.service";
import { ExecutiveReportsService } from "./executive-reports.service";

@UseGuards(JwtAuthGuard, SiteGuard, PermissionsGuard)
@Controller("executive")
export class ExecutiveController {
  constructor(
    private readonly executive: ExecutiveDashboardService,
    private readonly aggregation: ExecutiveAggregationService,
    private readonly performance: ExecutivePerformanceService,
    private readonly psmElements: ExecutivePsmElementService,
    private readonly criticalRisk: ExecutiveCriticalRiskService,
    private readonly managementReview: ExecutiveManagementReviewService,
    private readonly trends: ExecutiveTrendsService,
    private readonly reports: ExecutiveReportsService,
  ) {}
  @Get() @Permissions("executive.dashboard.view") root(
    @CurrentUser() user: RequestUser,
    @Query() query: Row,
  ) {
    return this.aggregation.dashboard(user, query);
  }
  @Get("dashboard") @Permissions("executive.dashboard.view") dashboard(
    @CurrentUser() user: RequestUser,
    @Query() query: Row,
  ) {
    return this.aggregation.dashboard(user, query);
  }
  @Get("dashboard/summary") @Permissions("executive.dashboard.view") summary(
    @CurrentUser() user: RequestUser,
    @Query() query: Row,
  ) {
    return this.aggregation.dashboardSummary(user, query);
  }
  @Get("dashboard/health") @Permissions("executive.dashboard.view") health(
    @CurrentUser() user: RequestUser,
    @Query() query: Row,
  ) {
    return this.aggregation.dashboardSummary(user, query);
  }
  @Get(
    "dashboard/:view(critical-alerts|module-health|site-performance|open-critical-actions|pending-approvals|stale-records|management-review-preview|source-health)",
  )
  @Permissions("executive.dashboard.view")
  dashboardView(
    @CurrentUser() user: RequestUser,
    @Param("view") view: string,
    @Query() query: Row,
  ) {
    return this.aggregation.dashboardView(user, view, query);
  }
  @Get("kpis") @Permissions("executive.kpi.view") kpis(
    @CurrentUser() user: RequestUser,
    @Query() query: Row,
  ) {
    return this.executive.kpiResults(user, query);
  }
  @Post("kpis/calculate") @Permissions("executive.kpi.refresh") calculate(
    @CurrentUser() user: RequestUser,
    @Body() dto: Row,
  ) {
    return this.executive.refresh(user, dto);
  }
  @Post("kpis/refresh") @Permissions("executive.kpi.refresh") refresh(
    @CurrentUser() user: RequestUser,
    @Body() dto: Row,
  ) {
    return this.executive.refresh(user, dto);
  }
  @Get("kpis/results") @Permissions("executive.kpi.view") results(
    @CurrentUser() user: RequestUser,
    @Query() query: Row,
  ) {
    return this.executive.kpiResults(user, query);
  }
  @Get("kpis/definitions")
  @Permissions("executive.kpi.definition.view")
  definitions(@CurrentUser() user: RequestUser, @Query() query: Row) {
    return this.executive.definitions(user, query);
  }
  @Post("kpis/definitions")
  @Permissions("executive.kpi.definition.create")
  createDefinition(@CurrentUser() user: RequestUser, @Body() dto: Row) {
    return this.executive.createDefinition(user, dto);
  }
  @Patch("kpis/definitions/:definitionId")
  @Permissions("executive.kpi.definition.edit")
  updateDefinition(
    @CurrentUser() user: RequestUser,
    @Param("definitionId") id: string,
    @Body() dto: Row,
  ) {
    return this.executive.updateDefinition(user, id, dto);
  }
  @Post("kpis/definitions/:definitionId/archive")
  @Permissions("executive.kpi.definition.archive")
  archiveDefinition(
    @CurrentUser() user: RequestUser,
    @Param("definitionId") id: string,
    @Body() dto: Row,
  ) {
    return this.executive.archiveDefinition(user, id, dto);
  }
  @Get("kpis/:kpiId") @Permissions("executive.kpi.detail.view") kpi(
    @CurrentUser() user: RequestUser,
    @Param("kpiId") id: string,
    @Query() query: Row,
  ) {
    return this.executive.kpiDetail(user, id, query);
  }
  @Get("kpis/:kpiId/overview")
  @Permissions("executive.kpi.detail.view")
  kpiOverview(
    @CurrentUser() user: RequestUser,
    @Param("kpiId") id: string,
    @Query() query: Row,
  ) {
    return this.executive.kpiDetail(user, id, query);
  }
  @Get("kpis/:kpiId/source-trace")
  @Permissions("executive.kpi.detail.view")
  kpiSourceTrace(
    @CurrentUser() user: RequestUser,
    @Param("kpiId") id: string,
    @Query() query: Row,
  ) {
    return this.executive.kpiDetail(user, id, query);
  }
  @Get("kpis/:kpiId/drilldown")
  @Permissions("executive.kpi.drilldown.view")
  kpiDrilldown(
    @CurrentUser() user: RequestUser,
    @Param("kpiId") id: string,
    @Query() query: Row,
  ) {
    return this.executive.kpiDetail(user, id, query);
  }
  @Get("snapshots") @Permissions("executive.kpi.snapshot.view") snapshots(
    @CurrentUser() user: RequestUser,
    @Query() query: Row,
  ) {
    return this.executive.snapshots(user, query);
  }
  @Post("snapshots")
  @Permissions("executive.kpi.snapshot.create")
  snapshotCreate(@CurrentUser() user: RequestUser, @Body() dto: Row) {
    return this.executive.createSnapshot(user, dto);
  }
  @Get("snapshots/:snapshotId/results")
  @Permissions("executive.kpi.snapshot.view")
  snapshotResults(
    @CurrentUser() user: RequestUser,
    @Param("snapshotId") id: string,
  ) {
    return this.executive.snapshotResults(user, id);
  }
  @Get("snapshots/:snapshotId/source-trace")
  @Permissions("executive.kpi.snapshot.view")
  snapshotSourceTrace(
    @CurrentUser() user: RequestUser,
    @Param("snapshotId") id: string,
  ) {
    return this.executive.snapshotSourceTrace(user, id);
  }
  @Get("snapshots/:snapshotId")
  @Permissions("executive.kpi.snapshot.view")
  snapshot(@CurrentUser() user: RequestUser, @Param("snapshotId") id: string) {
    return this.executive.snapshot(user, id);
  }
  @Post("snapshots/:snapshotId/archive")
  @Permissions("executive.kpi.snapshot.create")
  archiveSnapshot(
    @CurrentUser() user: RequestUser,
    @Param("snapshotId") id: string,
    @Body() dto: Row,
  ) {
    return this.executive.archiveSnapshot(user, id, dto);
  }
  @Get("modules") @Permissions("executive.dashboard.view") modules(
    @CurrentUser() user: RequestUser,
    @Query() query: Row,
  ) {
    return this.executive.dashboardView(user, "module-health", query);
  }
  @Get("modules/:moduleKey")
  @Permissions("executive.dashboard.view")
  async module(
    @CurrentUser() user: RequestUser,
    @Param("moduleKey") key: string,
    @Query() query: Row,
  ) {
    const rows = await this.executive.dashboardView(
      user,
      "module-health",
      query,
    );
    const row = (rows as Row[]).find((item) => item.moduleKey === key);
    if (!row) throw new NotFoundException("Executive module was not found.");
    return row;
  }
  @Get("sites") @Permissions("executive.dashboard.view") sites(
    @CurrentUser() user: RequestUser,
    @Query() query: Row,
  ) {
    return this.executive.sitePerformance(user, query);
  }
  @Get("sites/:siteId") @Permissions("executive.dashboard.view") site(
    @CurrentUser() user: RequestUser,
    @Param("siteId") siteId: string,
  ) {
    return this.executive.sitePerformance(user, { siteId });
  }
  @Get("company") @Permissions("executive.dashboard.view") company(
    @CurrentUser() user: RequestUser,
  ) {
    return this.executive.dashboard(user, {});
  }
  @Get("site/:siteId") @Permissions("executive.dashboard.view") siteView(
    @CurrentUser() user: RequestUser,
    @Param("siteId") siteId: string,
  ) {
    return this.executive.dashboard(user, { siteId });
  }
  @Get("unit/:unitId") @Permissions("executive.dashboard.view") unitView(
    @CurrentUser() user: RequestUser,
    @Param("unitId") unitId: string,
  ) {
    return this.executive.dashboard(user, { unitId });
  }
  @Get("area/:areaId") @Permissions("executive.dashboard.view") areaView(
    @CurrentUser() user: RequestUser,
    @Param("areaId") areaId: string,
  ) {
    return this.executive.dashboard(user, { areaId });
  }
  @Get("equipment/:equipmentId")
  @Permissions("executive.dashboard.view")
  equipmentView(
    @CurrentUser() user: RequestUser,
    @Param("equipmentId") equipmentId: string,
  ) {
    return this.executive.dashboard(user, { equipmentId });
  }
  @Get("critical-alerts")
  @Permissions("executive.dashboard.view")
  criticalAlerts(@CurrentUser() user: RequestUser, @Query() query: Row) {
    return this.executive.dashboardView(user, "critical-alerts", query);
  }
  @Get("dashboard/overdue-actions")
  @Permissions("executive.dashboard.view")
  overdue(@CurrentUser() user: RequestUser, @Query() query: Row) {
    return this.executive.dashboardView(user, "open-critical-actions", query);
  }
  @Get("pending-approvals") @Permissions("executive.dashboard.view") approvals(
    @CurrentUser() user: RequestUser,
    @Query() query: Row,
  ) {
    return this.executive.dashboardView(user, "pending-approvals", query);
  }
  @Get("stale-records") @Permissions("executive.dashboard.view") stale(
    @CurrentUser() user: RequestUser,
    @Query() query: Row,
  ) {
    return this.executive.dashboardView(user, "stale-records", query);
  }
  @Get("dashboard/management-review-preview")
  @Permissions("executive.dashboard.view")
  managementPreview(@CurrentUser() user: RequestUser, @Query() query: Row) {
    return this.executive.dashboardView(
      user,
      "management-review-preview",
      query,
    );
  }
  @Get("source-health")
  @Permissions("executive.source_health.view")
  sourceHealth(@CurrentUser() user: RequestUser, @Query() query: Row) {
    return this.executive.sourceHealth(user, query);
  }
  @Get("widgets") @Permissions("executive.widget.view") widgets(
    @CurrentUser() user: RequestUser,
  ) {
    return this.executive.widgets(user);
  }
  @Post("widgets") @Permissions("executive.widget.configure") createWidget(
    @CurrentUser() user: RequestUser,
    @Body() dto: Row,
  ) {
    return this.executive.createWidget(user, dto);
  }
  @Patch("widgets/:widgetId")
  @Permissions("executive.widget.configure")
  updateWidget(
    @CurrentUser() user: RequestUser,
    @Param("widgetId") id: string,
    @Body() dto: Row,
  ) {
    return this.executive.updateWidget(user, id, dto);
  }
  @Get("layouts") @Permissions("executive.layout.view") layouts(
    @CurrentUser() user: RequestUser,
  ) {
    return this.executive.layouts(user);
  }
  @Post("layouts") @Permissions("executive.layout.edit") saveLayout(
    @CurrentUser() user: RequestUser,
    @Body() dto: Row,
  ) {
    return this.executive.saveLayout(user, dto);
  }
  @Patch("layouts/:layoutId")
  @Permissions("executive.layout.edit")
  updateLayout(
    @CurrentUser() user: RequestUser,
    @Param("layoutId") id: string,
    @Body() dto: Row,
  ) {
    return this.executive.updateLayout(user, id, dto);
  }
  @Get("settings") @Permissions("executive.settings.view") settings(
    @CurrentUser() user: RequestUser,
  ) {
    return this.executive.settings(user);
  }
  @Patch("settings") @Permissions("executive.settings.edit") updateSettings(
    @CurrentUser() user: RequestUser,
    @Body() dto: Row,
  ) {
    return this.executive.updateSettings(user, dto);
  }
  @Get("thresholds") @Permissions("executive.kpi.threshold.view") thresholds(
    @CurrentUser() user: RequestUser,
    @Query() query: Row,
  ) {
    return this.executive.thresholds(user, query);
  }
  @Patch("thresholds/:definitionId")
  @Permissions("executive.kpi.threshold.edit")
  upsertThreshold(
    @CurrentUser() user: RequestUser,
    @Param("definitionId") definitionId: string,
    @Body() dto: Row,
  ) {
    return this.executive.upsertThreshold(user, definitionId, dto);
  }
  @Get("lookups/:kind") @Permissions("executive.kpi.view") lookups(
    @Param("kind") kind: string,
  ) {
    const aggLookups = this.aggregation.lookups() as Record<string, unknown>;
    const psmLookups = this.psmElements.lookups() as unknown as Record<string, unknown>;
    const perfLookups = this.performance.lookups() as unknown as Record<string, unknown>;
    const execLookups = this.executive.lookups() as unknown as Record<string, unknown>;
    const mrLookups = this.managementReview.lookups() as unknown as Record<string, unknown>;
    const trendLookups = this.trends.lookups() as unknown as Record<string, unknown>;
    return (
      aggLookups[kind] ??
      psmLookups[kind] ??
      perfLookups[kind] ??
      execLookups[kind] ??
      mrLookups[kind] ??
      trendLookups[kind] ??
      []
    );
  }
  @Get("psm-elements/dashboard")
  @Permissions("executive.psm_element.dashboard.view")
  psmDashboard(@CurrentUser() user: RequestUser, @Query() query: Row) {
    return this.psmElements.dashboard(user, query);
  }
  @Get("psm-elements/dashboard/summary")
  @Permissions("executive.psm_element.dashboard.view")
  psmDashboardSummary(@CurrentUser() user: RequestUser, @Query() query: Row) {
    return this.psmElements
      .dashboard(user, query)
      .then((value) => value.summary);
  }
  @Get("psm-elements/register")
  @Permissions("executive.psm_element.register.view")
  psmRegister(@CurrentUser() user: RequestUser, @Query() query: Row) {
    return this.psmElements.elements(user, query);
  }
  @Get("psm-elements")
  @Permissions("executive.psm_element.register.view")
  psmElementsList(@CurrentUser() user: RequestUser, @Query() query: Row) {
    return this.psmElements.elements(user, query);
  }
  @Post("psm-elements") @Permissions("executive.psm_element.create") psmCreate(
    @CurrentUser() user: RequestUser,
    @Body() dto: Row,
  ) {
    return this.psmElements.create(user, dto);
  }
  @Get("psm-elements/mapping")
  @Permissions("executive.psm_element.mapping.view")
  psmMappings(@CurrentUser() user: RequestUser, @Query() query: Row) {
    return this.psmElements.mappings(user, query);
  }
  @Post("psm-elements/mapping")
  @Permissions("executive.psm_element.mapping.edit")
  psmCreateMapping(@CurrentUser() user: RequestUser, @Body() dto: Row) {
    return this.psmElements.createMapping(user, dto);
  }
  @Patch("psm-elements/mapping/:mappingId")
  @Permissions("executive.psm_element.mapping.edit")
  psmUpdateMapping(
    @CurrentUser() user: RequestUser,
    @Param("mappingId") id: string,
    @Body() dto: Row,
  ) {
    return this.psmElements.updateMapping(user, id, dto);
  }
  @Get("psm-elements/kpi-mappings")
  @Permissions("executive.psm_element.kpi_mapping.view")
  psmKpiMappings(@CurrentUser() user: RequestUser, @Query() query: Row) {
    return this.psmElements.kpiMappings(user, query);
  }
  @Post("psm-elements/kpi-mappings")
  @Permissions("executive.psm_element.kpi_mapping.edit")
  psmCreateKpiMapping(@CurrentUser() user: RequestUser, @Body() dto: Row) {
    return this.psmElements.createKpiMapping(user, dto);
  }
  @Patch("psm-elements/kpi-mappings/:mappingId")
  @Permissions("executive.psm_element.kpi_mapping.edit")
  psmUpdateKpiMapping(
    @CurrentUser() user: RequestUser,
    @Param("mappingId") id: string,
    @Body() dto: Row,
  ) {
    return this.psmElements.updateKpiMapping(user, id, dto);
  }
  @Get("psm-elements/heatmap")
  @Permissions("executive.psm_element.heatmap.view")
  psmHeatmap(@CurrentUser() user: RequestUser, @Query() query: Row) {
    return this.psmElements.heatmap(user, query);
  }
  @Post("psm-elements/heatmap/recalculate")
  @Permissions("executive.psm_element.score.recalculate")
  psmHeatmapRecalculate(@CurrentUser() user: RequestUser, @Body() dto: Row) {
    return this.psmElements.scores(user, dto);
  }
  @Get("psm-elements/site-breakdown")
  @Permissions("executive.psm_element.site_breakdown.view")
  psmSiteBreakdown(@CurrentUser() user: RequestUser, @Query() query: Row) {
    return this.psmElements.breakdown(user, "site", query);
  }
  @Get("psm-elements/site-breakdown/:siteId")
  @Permissions("executive.psm_element.site_breakdown.view")
  psmSiteDetail(
    @CurrentUser() user: RequestUser,
    @Param("siteId") id: string,
    @Query() query: Row,
  ) {
    return this.psmElements.breakdown(user, "site", { ...query, siteId: id });
  }
  @Get("psm-elements/unit-breakdown")
  @Permissions("executive.psm_element.unit_breakdown.view")
  psmUnitBreakdown(@CurrentUser() user: RequestUser, @Query() query: Row) {
    return this.psmElements.breakdown(user, "unit", query);
  }
  @Get("psm-elements/unit-breakdown/:unitId")
  @Permissions("executive.psm_element.unit_breakdown.view")
  psmUnitDetail(
    @CurrentUser() user: RequestUser,
    @Param("unitId") id: string,
    @Query() query: Row,
  ) {
    return this.psmElements.breakdown(user, "unit", { ...query, unitId: id });
  }
  @Get("psm-elements/gaps")
  @Permissions("executive.psm_element.gap.view")
  psmGaps(@CurrentUser() user: RequestUser, @Query() query: Row) {
    return this.psmElements.gaps(user, query);
  }
  @Get("psm-elements/blockers")
  @Permissions("executive.psm_element.gap.view")
  psmBlockers(@CurrentUser() user: RequestUser, @Query() query: Row) {
    return this.psmElements.gaps(user, query);
  }
  @Get("psm-elements/snapshots")
  @Permissions("executive.psm_element.snapshot.view")
  psmSnapshots(@CurrentUser() user: RequestUser, @Query() query: Row) {
    return this.psmElements.snapshots(user, query);
  }
  @Post("psm-elements/snapshots")
  @Permissions("executive.psm_element.snapshot.create")
  psmSnapshotCreate(@CurrentUser() user: RequestUser, @Body() dto: Row) {
    return this.psmElements.snapshot(user, dto);
  }
  @Get("psm-elements/snapshots/:snapshotId")
  @Permissions("executive.psm_element.snapshot.view")
  psmSnapshotDetail(
    @CurrentUser() user: RequestUser,
    @Param("snapshotId") id: string,
  ) {
    return this.psmElements.snapshotDetail(user, id);
  }
  @Post("psm-elements/snapshots/:snapshotId/archive")
  @Permissions("executive.psm_element.snapshot.archive")
  psmSnapshotArchive(
    @CurrentUser() user: RequestUser,
    @Param("snapshotId") id: string,
    @Body() dto: Row,
  ) {
    return this.psmElements.archiveSnapshot(user, id, dto);
  }
  @Get("psm-elements/settings")
  @Permissions("executive.psm_element.view")
  psmSettings(@CurrentUser() user: RequestUser) {
    return this.psmElements.settings(user);
  }
  @Patch("psm-elements/settings")
  @Permissions("executive.psm_element.settings.edit")
  psmUpdateSettings(@CurrentUser() user: RequestUser, @Body() dto: Row) {
    return this.psmElements.updateSettings(user, dto);
  }
  @Get("psm-elements/:elementId")
  @Permissions("executive.psm_element.detail.view")
  psmDetail(
    @CurrentUser() user: RequestUser,
    @Param("elementId") id: string,
    @Query() query: Row,
  ) {
    return this.psmElements.detail(user, id, query);
  }
  @Patch("psm-elements/:elementId")
  @Permissions("executive.psm_element.edit")
  psmUpdate(
    @CurrentUser() user: RequestUser,
    @Param("elementId") id: string,
    @Body() dto: Row,
  ) {
    return this.psmElements.update(user, id, dto);
  }
  @Post("psm-elements/:elementId/archive")
  @Permissions("executive.psm_element.archive")
  psmArchive(
    @CurrentUser() user: RequestUser,
    @Param("elementId") id: string,
    @Body() dto: Row,
  ) {
    return this.psmElements.archive(user, id, dto);
  }
  @Post("psm-elements/:elementId/recalculate")
  @Permissions("executive.psm_element.score.recalculate")
  psmRecalculate(
    @CurrentUser() user: RequestUser,
    @Param("elementId") id: string,
    @Body() dto: Row,
  ) {
    return this.psmElements.recalculate(user, id, dto);
  }
  @Get(
    "psm-elements/:elementId/:view(overview|scorecard|source-modules|kpis|gaps|actions|evidence|approvals|source-trace|history)",
  )
  @Permissions("executive.psm_element.detail.view")
  psmView(
    @CurrentUser() user: RequestUser,
    @Param("elementId") id: string,
    @Param("view") view: string,
    @Query() query: Row,
  ) {
    return this.psmElements
      .detail(user, id, query)
      .then(
        (detail) =>
          ({
            overview: detail,
            scorecard: { score: detail.score, factors: detail.factors },
            "source-modules": detail.modules,
            kpis: detail.kpis,
            gaps: detail.gaps,
            actions: detail.gaps.filter(
              (gap: Row) => gap.gap_type === "Overdue Action",
            ),
            evidence: {
              missingEvidenceCount: detail.score.missing_evidence_count,
            },
            approvals: {
              pendingApprovalCount: detail.score.pending_approval_count,
            },
            "source-trace": detail.sourceTrace,
            history: detail.history,
          })[view],
      );
  }
  @Post("aggregation/run")
  @Permissions("executive.aggregation.run")
  aggregationRun(@CurrentUser() user: RequestUser, @Body() dto: Row) {
    return this.aggregation.run(user, dto);
  }
  @Get("aggregation/runs")
  @Permissions("executive.aggregation.history.view")
  aggregationRuns(@CurrentUser() user: RequestUser, @Query() query: Row) {
    return this.aggregation.runs(user, query);
  }
  @Get("aggregation/runs/:runId")
  @Permissions("executive.aggregation.history.view")
  aggregationRunDetail(
    @CurrentUser() user: RequestUser,
    @Param("runId") id: string,
  ) {
    return this.aggregation.detail(user, id);
  }
  @Get("aggregation/runs/:runId/results")
  @Permissions("executive.aggregation.history.view")
  aggregationResults(
    @CurrentUser() user: RequestUser,
    @Param("runId") id: string,
  ) {
    return this.aggregation.detail(user, id);
  }
  @Get("aggregation/runs/:runId/source-records")
  @Permissions("executive.source_trace.view")
  aggregationSourceRecords(
    @CurrentUser() user: RequestUser,
    @Param("runId") id: string,
  ) {
    return this.aggregation.detail(user, id);
  }
  @Get("aggregation/runs/:runId/errors")
  @Permissions("executive.aggregation_error.view")
  aggregationRunErrors(
    @CurrentUser() user: RequestUser,
    @Param("runId") id: string,
  ) {
    return this.aggregation.detail(user, id);
  }
  @Post("aggregation/runs/:runId/retry")
  @Permissions("executive.aggregation.run")
  aggregationRetry(
    @CurrentUser() user: RequestUser,
    @Param("runId") id: string,
  ) {
    return this.aggregation
      .detail(user, id)
      .then((detail) =>
        this.aggregation.run(user, detail.run.scope_json ?? {}),
      );
  }
  @Post("aggregation/runs/:runId/archive")
  @Permissions("executive.aggregation.history.view")
  aggregationArchive(
    @CurrentUser() user: RequestUser,
    @Param("runId") id: string,
    @Body() dto: Row,
  ) {
    return this.aggregation.archiveRun(user, id, dto);
  }
  @Get("module-health")
  @Permissions("executive.module_health.view")
  moduleHealth(@CurrentUser() user: RequestUser, @Query() query: Row) {
    return this.aggregation.moduleHealth(user, query);
  }
  @Get("module-health/:moduleKey")
  @Permissions("executive.module_health.detail.view")
  moduleHealthDetail(
    @CurrentUser() user: RequestUser,
    @Param("moduleKey") key: string,
    @Query() query: Row,
  ) {
    return this.aggregation.moduleDetail(user, key, query);
  }
  @Post("module-health/:moduleKey/recalculate")
  @Permissions("executive.module_health.recalculate")
  moduleHealthRecalculate(
    @CurrentUser() user: RequestUser,
    @Param("moduleKey") key: string,
    @Body() dto: Row,
  ) {
    return this.aggregation.recalculateModule(user, key, dto);
  }
  @Get("module-health/:moduleKey/source-trace")
  @Permissions("executive.source_trace.view")
  moduleHealthSourceTrace(
    @CurrentUser() user: RequestUser,
    @Param("moduleKey") key: string,
    @Query() query: Row,
  ) {
    return this.aggregation.moduleDetail(user, key, query);
  }
  @Get("module-health/:moduleKey/critical-items")
  @Permissions("executive.module_health.detail.view")
  moduleHealthCritical(
    @CurrentUser() user: RequestUser,
    @Param("moduleKey") key: string,
    @Query() query: Row,
  ) {
    return this.aggregation.moduleDetail(user, key, query);
  }
  @Get("module-health/:moduleKey/overdue-items")
  @Permissions("executive.module_health.detail.view")
  moduleHealthOverdue(
    @CurrentUser() user: RequestUser,
    @Param("moduleKey") key: string,
    @Query() query: Row,
  ) {
    return this.aggregation.moduleDetail(user, key, query);
  }
  @Get("module-health/:moduleKey/stale-records")
  @Permissions("executive.module_health.detail.view")
  moduleHealthStale(
    @CurrentUser() user: RequestUser,
    @Param("moduleKey") key: string,
    @Query() query: Row,
  ) {
    return this.aggregation.moduleDetail(user, key, query);
  }
  @Get("module-health/:moduleKey/pending-approvals")
  @Permissions("executive.module_health.detail.view")
  moduleHealthApprovals(
    @CurrentUser() user: RequestUser,
    @Param("moduleKey") key: string,
    @Query() query: Row,
  ) {
    return this.aggregation.moduleDetail(user, key, query);
  }
  @Get("critical-alerts/by-module")
  @Permissions("executive.critical_alert.view")
  alertsByModule(@CurrentUser() user: RequestUser, @Query() query: Row) {
    return this.aggregation.alerts(user, query);
  }
  @Get("critical-alerts/by-site")
  @Permissions("executive.critical_alert.view")
  alertsBySite(@CurrentUser() user: RequestUser, @Query() query: Row) {
    return this.aggregation.alerts(user, query);
  }
  @Get("critical-alerts/by-owner")
  @Permissions("executive.critical_alert.view")
  alertsByOwner(@CurrentUser() user: RequestUser, @Query() query: Row) {
    return this.aggregation.alerts(user, query);
  }
  @Get("critical-alerts/:alertId")
  @Permissions("executive.critical_alert.view")
  alert(@CurrentUser() user: RequestUser, @Param("alertId") id: string) {
    return this.aggregation.alerts(user).then(
      (rows) =>
        rows.find((row) => row.id === id) ??
        (() => {
          throw new NotFoundException("Critical alert was not found.");
        })(),
    );
  }
  @Post("critical-alerts/:alertId/resolve")
  @Permissions("executive.critical_alert.resolve")
  resolveAlert(
    @CurrentUser() user: RequestUser,
    @Param("alertId") id: string,
    @Body() dto: Row,
  ) {
    return this.aggregation.resolveAlert(user, id, dto);
  }
  @Get("site-performance")
  @Permissions("executive.site_performance.view")
  sitePerformance(@CurrentUser() user: RequestUser, @Query() query: Row) {
    return this.aggregation.sitePerformance(user, query);
  }
  @Get("site-performance/:siteId")
  @Permissions("executive.site_performance.view")
  sitePerformanceDetail(
    @CurrentUser() user: RequestUser,
    @Param("siteId") id: string,
  ) {
    return this.aggregation.sitePerformance(user, { siteId: id });
  }
  @Get("unit-performance")
  @Permissions("executive.unit_performance.view")
  unitPerformance(@CurrentUser() user: RequestUser, @Query() query: Row) {
    return this.aggregation.unitPerformance(user, query);
  }
  @Get("unit-performance/:unitId")
  @Permissions("executive.unit_performance.view")
  unitPerformanceDetail(
    @CurrentUser() user: RequestUser,
    @Param("unitId") id: string,
  ) {
    return this.aggregation.unitPerformance(user, { unitId: id });
  }
  @Get("source-configs")
  @Permissions("executive.source_config.view")
  sourceConfigs(@CurrentUser() user: RequestUser) {
    return this.aggregation.sourceConfigs(user);
  }
  @Patch("source-configs/:configId")
  @Permissions("executive.source_config.edit")
  updateSourceConfig(
    @CurrentUser() user: RequestUser,
    @Param("configId") id: string,
    @Body() dto: Row,
  ) {
    return this.aggregation.updateSourceConfig(user, id, dto);
  }
  @Get("aggregation-errors")
  @Permissions("executive.aggregation_error.view")
  aggregationErrors(@CurrentUser() user: RequestUser, @Query() query: Row) {
    return this.aggregation.aggregationErrors(user, query);
  }
  @Post("aggregation-errors/:errorId/resolve")
  @Permissions("executive.aggregation_error.resolve")
  resolveAggregationError(
    @CurrentUser() user: RequestUser,
    @Param("errorId") id: string,
    @Body() dto: Row,
  ) {
    return this.aggregation.resolveError(user, id, dto);
  }
  @Get("performance/dashboard")
  @Permissions("executive.performance.dashboard.view")
  performanceDashboard(@CurrentUser() user: RequestUser, @Query() query: Row) {
    return this.performance.dashboard(user, query);
  }
  @Get("performance/dashboard/summary")
  @Permissions("executive.performance.dashboard.view")
  performanceSummary(@CurrentUser() user: RequestUser, @Query() query: Row) {
    return this.performance
      .dashboard(user, query)
      .then((value) => value.summary);
  }
  @Get("performance/company")
  @Permissions("executive.performance.company.view")
  performanceCompany(@CurrentUser() user: RequestUser, @Query() query: Row) {
    return this.performance.company(user, query);
  }
  @Post("performance/recalculate")
  @Permissions("executive.performance.recalculate")
  performanceRecalculate(@CurrentUser() user: RequestUser, @Body() dto: Row) {
    return this.performance.recalculate(user, dto);
  }
  @Get("performance/:scopeType(sites|departments|units|areas|equipment)")
  @Permissions("executive.performance.view")
  performanceScopes(
    @CurrentUser() user: RequestUser,
    @Param("scopeType") scopeType: string,
    @Query() query: Row,
  ) {
    return this.performance.scopes(
      user,
      this.performanceType(scopeType),
      query,
    );
  }
  @Get(
    "performance/:scopeType(sites|departments|units|areas|equipment)/:scopeId",
  )
  @Permissions("executive.performance.view")
  performanceScope(
    @CurrentUser() user: RequestUser,
    @Param("scopeType") scopeType: string,
    @Param("scopeId") id: string,
    @Query() query: Row,
  ) {
    return this.performance.detail(
      user,
      this.performanceType(scopeType),
      id,
      query,
    );
  }
  @Get(
    "performance/:scopeType(sites|departments|units|areas|equipment)/:scopeId/modules",
  )
  @Permissions("executive.performance.view")
  performanceModules(
    @CurrentUser() user: RequestUser,
    @Param("scopeType") scopeType: string,
    @Param("scopeId") id: string,
    @Query() query: Row,
  ) {
    return this.performance.modules(
      user,
      this.performanceType(scopeType),
      id,
      query,
    );
  }
  @Get(
    "performance/:scopeType(sites|departments|units|areas|equipment)/:scopeId/kpis",
  )
  @Permissions("executive.performance.view")
  performanceKpis(
    @CurrentUser() user: RequestUser,
    @Param("scopeType") scopeType: string,
    @Param("scopeId") id: string,
    @Query() query: Row,
  ) {
    return this.performance.kpis(
      user,
      this.performanceType(scopeType),
      id,
      query,
    );
  }
  @Get(
    "performance/:scopeType(sites|departments|units|areas|equipment)/:scopeId/:kind(critical-alerts|overdue-actions|pending-approvals|stale-records|source-trace)",
  )
  @Permissions("executive.performance.view")
  performanceItems(
    @CurrentUser() user: RequestUser,
    @Param("scopeType") scopeType: string,
    @Param("scopeId") id: string,
    @Param("kind") kind: any,
    @Query() query: Row,
  ) {
    return this.performance.items(
      user,
      this.performanceType(scopeType),
      id,
      kind,
      query,
    );
  }
  @Post("performance/:scopeType(sites|units)/:scopeId/recalculate")
  @Permissions("executive.performance.recalculate")
  performanceScopeRecalculate(
    @CurrentUser() user: RequestUser,
    @Param("scopeType") scopeType: string,
    @Param("scopeId") id: string,
    @Body() dto: Row,
  ) {
    const type = this.performanceType(scopeType);
    return this.performance.recalculate(user, { ...dto, [`${type}Id`]: id });
  }
  @Post("performance/:scopeType(sites|units)/:scopeId/snapshot")
  @Permissions("executive.performance.snapshot.create")
  performanceScopeSnapshot(
    @CurrentUser() user: RequestUser,
    @Param("scopeType") scopeType: string,
    @Param("scopeId") id: string,
    @Body() dto: Row,
  ) {
    return this.performance.snapshot(user, {
      ...dto,
      scopeType: this.performanceType(scopeType),
      scopeId: id,
    });
  }
  @Get("performance/compare")
  @Permissions("executive.performance.compare.view")
  performanceCompare(@CurrentUser() user: RequestUser, @Query() query: Row) {
    return this.performance.compare(user, query);
  }
  @Post("performance/compare")
  @Permissions("executive.performance.compare.view")
  performanceCompareCreate(@CurrentUser() user: RequestUser, @Body() dto: Row) {
    return this.performance.compare(user, dto);
  }
  @Get("performance/heatmap")
  @Permissions("executive.performance.heatmap.view")
  performanceHeatmap(@CurrentUser() user: RequestUser, @Query() query: Row) {
    return this.performance.heatmap(user, query);
  }
  @Post("performance/heatmap")
  @Permissions("executive.performance.heatmap.view")
  performanceHeatmapCreate(@CurrentUser() user: RequestUser, @Body() dto: Row) {
    return this.performance.heatmap(user, dto);
  }
  @Get("performance/rankings")
  @Permissions("executive.performance.ranking.view")
  performanceRankings(@CurrentUser() user: RequestUser, @Query() query: Row) {
    return this.performance.rankings(user, query);
  }
  @Post("performance/rankings/recalculate")
  @Permissions("executive.performance.ranking.view")
  performanceRankingRecalculate(
    @CurrentUser() user: RequestUser,
    @Body() dto: Row,
  ) {
    return this.performance.rankings(user, dto);
  }
  @Get("performance/drilldown")
  @Permissions("executive.performance.drilldown.view")
  performanceDrilldown(@CurrentUser() user: RequestUser, @Query() query: Row) {
    return this.performance.drilldown(user, query);
  }
  @Post("performance/drilldown")
  @Permissions("executive.performance.drilldown.view")
  performanceDrilldownCreate(
    @CurrentUser() user: RequestUser,
    @Body() dto: Row,
  ) {
    return this.performance.drilldown(user, dto);
  }
  @Get("performance/drilldown/children")
  @Permissions("executive.performance.drilldown.view")
  performanceDrilldownChildren(
    @CurrentUser() user: RequestUser,
    @Query() query: Row,
  ) {
    return this.performance
      .drilldown(user, query)
      .then((value) => value.children);
  }
  @Get("performance/drilldown/source-records")
  @Permissions("executive.performance.source_trace.view")
  performanceDrilldownSources(
    @CurrentUser() user: RequestUser,
    @Query() query: Row,
  ) {
    return this.performance
      .drilldown(user, query)
      .then((value) => value.sourceTrace);
  }
  @Get("performance/snapshots")
  @Permissions("executive.performance.snapshot.view")
  performanceSnapshots(@CurrentUser() user: RequestUser, @Query() query: Row) {
    return this.performance.snapshots(user, query);
  }
  @Post("performance/snapshots")
  @Permissions("executive.performance.snapshot.create")
  performanceSnapshotCreate(
    @CurrentUser() user: RequestUser,
    @Body() dto: Row,
  ) {
    return this.performance.snapshot(user, dto);
  }
  @Get("performance/snapshots/:snapshotId")
  @Permissions("executive.performance.snapshot.view")
  performanceSnapshot(
    @CurrentUser() user: RequestUser,
    @Param("snapshotId") id: string,
  ) {
    return this.performance.snapshotDetail(user, id);
  }
  @Post("performance/snapshots/:snapshotId/archive")
  @Permissions("executive.performance.snapshot.archive")
  performanceSnapshotArchive(
    @CurrentUser() user: RequestUser,
    @Param("snapshotId") id: string,
    @Body() dto: Row,
  ) {
    return this.performance.archiveSnapshot(user, id, dto);
  }
  @Get("lookups/performance-:kind")
  @Permissions("executive.performance.view")
  performanceLookups(@Param("kind") kind: string) {
    return (
      (this.performance.lookups() as Record<string, string[]>)[
        `performance-${kind}`
      ] ?? []
    );
  }
  @Get("critical-risks/dashboard")
  @Permissions("executive.critical_risk.dashboard.view")
  criticalRiskDashboard(@CurrentUser() user: RequestUser, @Query() query: Row) {
    return this.criticalRisk.dashboard(user, query);
  }
  @Get("critical-risks/dashboard/summary")
  @Permissions("executive.critical_risk.dashboard.view")
  criticalRiskDashboardSummary(@CurrentUser() user: RequestUser, @Query() query: Row) {
    return this.criticalRisk.dashboard(user, query);
  }
  @Get("critical-risks/barriers")
  @Permissions("executive.critical_risk.register.view")
  criticalRiskBarriers(@CurrentUser() user: RequestUser, @Query() query: Row) {
    return this.criticalRisk.barriers(user, query);
  }
  @Post("critical-risks/recalculate")
  @Permissions("executive.critical_risk.recalculate")
  criticalRiskRecalculate(@CurrentUser() user: RequestUser, @Body() dto: Row) {
    return this.criticalRisk.recalculate(user, dto);
  }
  @Get("critical-risks/register")
  @Permissions("executive.critical_risk.register.view")
  criticalRiskRegister(@CurrentUser() user: RequestUser, @Query() query: Row) {
    return this.criticalRisk.cases(user, query);
  }
  @Get("critical-risks")
  @Permissions("executive.critical_risk.register.view")
  criticalRisks(@CurrentUser() user: RequestUser, @Query() query: Row) {
    return this.criticalRisk.cases(user, query);
  }
  @Get("critical-risks/critical")
  @Permissions("executive.critical_risk.register.view")
  criticalRisksOnly(@CurrentUser() user: RequestUser, @Query() query: Row) {
    return this.criticalRisk.cases(user, { ...query, view: "critical" });
  }
  @Get("critical-risks/high-priority")
  @Permissions("executive.critical_risk.register.view")
  highPriorityRisks(@CurrentUser() user: RequestUser, @Query() query: Row) {
    return this.criticalRisk.cases(user, { ...query, priority: "High" });
  }
  @Get("critical-risks/unacknowledged")
  @Permissions("executive.critical_risk.register.view")
  unacknowledgedRisks(@CurrentUser() user: RequestUser, @Query() query: Row) {
    return this.criticalRisk.cases(user, { ...query, view: "unacknowledged" });
  }
  @Get("critical-risks/awaiting-verification")
  @Permissions("executive.critical_risk.register.view")
  awaitingVerificationRisks(
    @CurrentUser() user: RequestUser,
    @Query() query: Row,
  ) {
    return this.criticalRisk.cases(user, {
      ...query,
      view: "awaiting-verification",
    });
  }
  @Get("critical-risks/history")
  @Permissions("executive.critical_risk.history.view")
  criticalRiskHistory(@CurrentUser() user: RequestUser, @Query() query: Row) {
    return this.criticalRisk.historyList(user, query);
  }
  @Get("critical-risks/:riskCaseId")
  @Permissions("executive.critical_risk.detail.view")
  criticalRiskDetail(
    @CurrentUser() user: RequestUser,
    @Param("riskCaseId") id: string,
  ) {
    return this.criticalRisk.caseDetail(user, id);
  }
  @Post("critical-risks/:riskCaseId/acknowledge")
  @Permissions("executive.critical_risk.acknowledge")
  criticalRiskAcknowledge(
    @CurrentUser() user: RequestUser,
    @Param("riskCaseId") id: string,
    @Body() dto: Row,
  ) {
    return this.criticalRisk.acknowledge(user, id, dto);
  }
  @Post("critical-risks/:riskCaseId/assign-owner")
  @Permissions("executive.critical_risk.owner.assign")
  criticalRiskAssignOwner(
    @CurrentUser() user: RequestUser,
    @Param("riskCaseId") id: string,
    @Body() dto: Row,
  ) {
    return this.criticalRisk.assignOwner(user, id, dto);
  }
  @Post("critical-risks/:riskCaseId/actions")
  @Permissions("executive.critical_risk.action.create")
  criticalRiskCreateAction(
    @CurrentUser() user: RequestUser,
    @Param("riskCaseId") id: string,
    @Body() dto: Row,
  ) {
    return this.criticalRisk.createAction(user, id, dto);
  }
  @Post("critical-risks/:riskCaseId/link-action")
  @Permissions("executive.critical_risk.action.link")
  criticalRiskLinkAction(
    @CurrentUser() user: RequestUser,
    @Param("riskCaseId") id: string,
    @Body() dto: Row,
  ) {
    return this.criticalRisk.linkAction(user, id, dto);
  }
  @Post("critical-risks/:riskCaseId/request-verification")
  @Permissions("executive.critical_risk.verification.request")
  criticalRiskVerification(
    @CurrentUser() user: RequestUser,
    @Param("riskCaseId") id: string,
    @Body() dto: Row,
  ) {
    return this.criticalRisk.requestVerification(user, id, dto);
  }
  @Post("critical-risks/:riskCaseId/close")
  @Permissions("executive.critical_risk.case.close")
  criticalRiskClose(
    @CurrentUser() user: RequestUser,
    @Param("riskCaseId") id: string,
    @Body() dto: Row,
  ) {
    return this.criticalRisk.closeCase(user, id, dto);
  }
  @Get("overdue-actions/dashboard")
  @Permissions("executive.overdue_action.dashboard.view")
  overdueActionDashboard(
    @CurrentUser() user: RequestUser,
    @Query() query: Row,
  ) {
    return this.criticalRisk.dashboard(user, query);
  }
  @Get("overdue-actions/dashboard/summary")
  @Permissions("executive.overdue_action.dashboard.view")
  overdueActionDashboardSummary(@CurrentUser() user: RequestUser, @Query() query: Row) {
    return this.criticalRisk.dashboard(user, query);
  }
  @Get("overdue-actions/critical")
  @Permissions("executive.overdue_action.register.view")
  overdueActionsCritical(@CurrentUser() user: RequestUser, @Query() query: Row) {
    return this.criticalRisk.overdueActions(user, { ...query, priority: "Critical" });
  }
  @Get("overdue-actions/high-priority")
  @Permissions("executive.overdue_action.register.view")
  overdueActionsHighPriority(@CurrentUser() user: RequestUser, @Query() query: Row) {
    return this.criticalRisk.overdueActions(user, { ...query, priority: "High" });
  }
  @Get("overdue-actions/by-owner")
  @Permissions("executive.overdue_action.owner.view")
  overdueActionsByOwner(@CurrentUser() user: RequestUser, @Query() query: Row) {
    return this.criticalRisk.overdueActionsByOwner(user, query);
  }
  @Get("overdue-actions/by-site")
  @Permissions("executive.overdue_action.dashboard.view")
  overdueActionsBySite(@CurrentUser() user: RequestUser, @Query() query: Row) {
    return this.criticalRisk.overdueActionsBySite(user, query);
  }
  @Get("overdue-actions/by-module")
  @Permissions("executive.overdue_action.dashboard.view")
  overdueActionsByModule(@CurrentUser() user: RequestUser, @Query() query: Row) {
    return this.criticalRisk.overdueActionsByModule(user, query);
  }
  @Get("overdue-actions/register")
  @Permissions("executive.overdue_action.register.view")
  overdueActionRegister(@CurrentUser() user: RequestUser, @Query() query: Row) {
    return this.criticalRisk.overdueActions(user, query);
  }
  @Get("overdue-actions")
  @Permissions("executive.overdue_action.register.view")
  overdueActionList(@CurrentUser() user: RequestUser, @Query() query: Row) {
    return this.criticalRisk.overdueActions(user, query);
  }
  @Get("overdue-actions/:snapshotId")
  @Permissions("executive.overdue_action.detail.view")
  overdueActionDetail(
    @CurrentUser() user: RequestUser,
    @Param("snapshotId") id: string,
  ) {
    return this.criticalRisk.overdueActionDetail(user, id);
  }
  @Get("escalations/dashboard")
  @Permissions("executive.escalation.dashboard.view")
  escalationDashboard(@CurrentUser() user: RequestUser, @Query() query: Row) {
    return this.criticalRisk.dashboard(user, query);
  }
  @Get("escalations/dashboard/summary")
  @Permissions("executive.escalation.dashboard.view")
  escalationDashboardSummary(@CurrentUser() user: RequestUser, @Query() query: Row) {
    return this.criticalRisk.dashboard(user, query);
  }
  @Get("escalations/active")
  @Permissions("executive.escalation.register.view")
  escalationsActive(@CurrentUser() user: RequestUser, @Query() query: Row) {
    return this.criticalRisk.escalations(user, { ...query, status: "Active" });
  }
  @Get("escalations/my-escalations")
  @Permissions("executive.escalation.register.view")
  escalationsMy(@CurrentUser() user: RequestUser, @Query() query: Row) {
    return this.criticalRisk.escalations(user, { ...query, view: "my-escalations" });
  }
  @Get("escalations/unacknowledged")
  @Permissions("executive.escalation.register.view")
  escalationsUnacknowledged(@CurrentUser() user: RequestUser, @Query() query: Row) {
    return this.criticalRisk.escalations(user, { ...query, view: "unacknowledged" });
  }
  @Get("escalations/overdue")
  @Permissions("executive.escalation.register.view")
  escalationsOverdue(@CurrentUser() user: RequestUser, @Query() query: Row) {
    return this.criticalRisk.escalations(user, { ...query, status: "Overdue" });
  }
  @Get("escalations/history")
  @Permissions("executive.escalation.history.view")
  escalationsHistory(@CurrentUser() user: RequestUser, @Query() query: Row) {
    return this.criticalRisk.historyList(user, query);
  }
  @Get("escalations/register")
  @Permissions("executive.escalation.register.view")
  escalationRegister(@CurrentUser() user: RequestUser, @Query() query: Row) {
    return this.criticalRisk.escalations(user, query);
  }
  @Get("escalations")
  @Permissions("executive.escalation.register.view")
  escalations(@CurrentUser() user: RequestUser, @Query() query: Row) {
    return this.criticalRisk.escalations(user, query);
  }
  @Post("escalations")
  @Permissions("executive.escalation.create")
  escalationCreate(@CurrentUser() user: RequestUser, @Body() dto: Row) {
    return this.criticalRisk.createEscalation(user, dto);
  }
  @Get("escalations/rules")
  @Permissions("executive.escalation.rule.view")
  escalationRules(@CurrentUser() user: RequestUser, @Query() query: Row) {
    return this.criticalRisk.rules(user, query);
  }
  @Post("escalations/rules")
  @Permissions("executive.escalation.rule.create")
  escalationRuleCreate(@CurrentUser() user: RequestUser, @Body() dto: Row) {
    return this.criticalRisk.saveRule(user, dto);
  }
  @Post("escalations/rules/dry-run")
  @Permissions("executive.escalation.rule.edit")
  escalationRuleDryRun(@CurrentUser() user: RequestUser, @Body() dto: Row) {
    return this.criticalRisk.dryRunRule(user, dto);
  }
  @Post("escalations/rules/:ruleId/approve")
  @Permissions("executive.escalation.rule.approve")
  escalationRuleApprove(@CurrentUser() user: RequestUser, @Param("ruleId") id: string) {
    return this.criticalRisk.approveRule(user, id);
  }
  @Post("escalations/rules/:ruleId/archive")
  @Permissions("executive.escalation.rule.archive")
  escalationRuleArchive(@CurrentUser() user: RequestUser, @Param("ruleId") id: string, @Body() dto: Row) {
    return this.criticalRisk.archiveRule(user, id, dto);
  }
  @Patch("escalations/rules/:ruleId")
  @Permissions("executive.escalation.rule.edit")
  escalationRuleUpdate(
    @CurrentUser() user: RequestUser,
    @Param("ruleId") id: string,
    @Body() dto: Row,
  ) {
    return this.criticalRisk.saveRule(user, dto, id);
  }
  @Get("escalations/:escalationId")
  @Permissions("executive.escalation.detail.view")
  escalationDetail(
    @CurrentUser() user: RequestUser,
    @Param("escalationId") id: string,
  ) {
    return this.criticalRisk.escalationDetail(user, id);
  }
  @Post("escalations/:escalationId/acknowledge")
  @Permissions("executive.escalation.acknowledge")
  escalationAcknowledge(
    @CurrentUser() user: RequestUser,
    @Param("escalationId") id: string,
    @Body() dto: Row,
  ) {
    return this.criticalRisk.acknowledgeEscalation(user, id, dto);
  }
  @Post("escalations/:escalationId/reassign")
  @Permissions("executive.escalation.reassign")
  escalationReassign(
    @CurrentUser() user: RequestUser,
    @Param("escalationId") id: string,
    @Body() dto: Row,
  ) {
    return this.criticalRisk.reassignEscalation(user, id, dto);
  }
  @Post("escalations/:escalationId/escalate")
  @Permissions("executive.escalation.level.increase")
  escalationAdvance(
    @CurrentUser() user: RequestUser,
    @Param("escalationId") id: string,
    @Body() dto: Row,
  ) {
    return this.criticalRisk.advanceEscalationLevel(user, id, dto);
  }
  @Post("escalations/:escalationId/cancel")
  @Permissions("executive.escalation.cancel")
  escalationCancel(
    @CurrentUser() user: RequestUser,
    @Param("escalationId") id: string,
    @Body() dto: Row,
  ) {
    return this.criticalRisk.cancelEscalation(user, id, dto);
  }
  @Post("escalations/:escalationId/decisions")
  @Permissions("executive.escalation.decision.create")
  escalationDecision(
    @CurrentUser() user: RequestUser,
    @Param("escalationId") id: string,
    @Body() dto: Row,
  ) {
    return this.criticalRisk.decideEscalation(user, id, dto);
  }
  @Post("escalations/:escalationId/close")
  @Permissions("executive.escalation.close")
  escalationClose(
    @CurrentUser() user: RequestUser,
    @Param("escalationId") id: string,
    @Body() dto: Row,
  ) {
    return this.criticalRisk.closeEscalation(user, id, dto);
  }

  @Get("leadership-attention")
  @Permissions("executive.leadership_attention.view")
  leadershipAttention(@CurrentUser() user: RequestUser, @Query() query: Row) {
    return this.criticalRisk.leadership(user, query);
  }
  @Get("leadership-attention/critical")
  @Permissions("executive.leadership_attention.view")
  leadershipAttentionCritical(@CurrentUser() user: RequestUser, @Query() query: Row) {
    return this.criticalRisk.cases(user, { ...query, view: "critical" });
  }
  @Get("leadership-attention/unacknowledged")
  @Permissions("executive.leadership_attention.view")
  leadershipAttentionUnack(@CurrentUser() user: RequestUser, @Query() query: Row) {
    return this.criticalRisk.cases(user, { ...query, view: "unacknowledged" });
  }
  @Get("leadership-attention/decisions-required")
  @Permissions("executive.leadership_attention.view")
  leadershipAttentionDecisions(@CurrentUser() user: RequestUser, @Query() query: Row) {
    return this.criticalRisk.cases(user, { ...query, status: "Management Decision Pending" });
  }
  @Get("leadership-attention/management-review-candidates")
  @Permissions("executive.leadership_attention.view")
  leadershipAttentionReviewCandidates(@CurrentUser() user: RequestUser, @Query() query: Row) {
    return this.criticalRisk.leadership(user, query);
  }

  @Get("lookups/:type(risk-case-statuses|risk-priority-levels|barrier-statuses|escalation-levels|escalation-statuses|escalation-trigger-types|management-decision-types|acknowledgment-types|escalation-sla-statuses)")
  riskLookups(@Param("type") type: string) {
    return this.criticalRisk.lookups(type);
  }
  @Get("management-review")
  @Permissions("executive.management_review.view")
  managementReviewRoot(@CurrentUser() user: RequestUser, @Query() query: Row) {
    return this.managementReview.dashboard(user, query);
  }
  @Get("management-review/context")
  @Permissions("executive.management_review.view")
  managementReviewContext(
    @CurrentUser() user: RequestUser,
    @Query() query: Row,
  ) {
    return this.managementReview.context(user, query);
  }
  @Get("management-review/dashboard")
  @Permissions("executive.management_review.dashboard.view")
  managementReviewDashboard(
    @CurrentUser() user: RequestUser,
    @Query() query: Row,
  ) {
    return this.managementReview.dashboard(user, query);
  }
  @Get("management-review/dashboard/summary")
  @Permissions("executive.management_review.dashboard.view")
  managementReviewSummary(
    @CurrentUser() user: RequestUser,
    @Query() query: Row,
  ) {
    return this.managementReview
      .dashboard(user, query)
      .then((value) => value.summary);
  }
  @Get("management-review/dashboard/upcoming-meetings")
  @Permissions("executive.management_review.dashboard.view")
  managementReviewUpcoming(
    @CurrentUser() user: RequestUser,
    @Query() query: Row,
  ) {
    return this.managementReview.meetings(user, {
      ...query,
      status: "Scheduled",
    });
  }
  @Get("management-review/dashboard/pending-decisions")
  @Permissions("executive.management_review.dashboard.view")
  managementReviewPendingDecisions(
    @CurrentUser() user: RequestUser,
    @Query() query: Row,
  ) {
    return this.managementReview
      .dashboard(user, query)
      .then((value) => value.pendingDecisions);
  }
  @Get("management-review/dashboard/open-commitments")
  @Permissions("executive.management_review.dashboard.view")
  managementReviewOpenCommitments(
    @CurrentUser() user: RequestUser,
    @Query() query: Row,
  ) {
    return this.managementReview
      .dashboard(user, query)
      .then((value) => value.openCommitments);
  }
  @Get("management-review/dashboard/critical-issues")
  @Permissions("executive.management_review.dashboard.view")
  managementReviewCriticalIssues(
    @CurrentUser() user: RequestUser,
    @Query() query: Row,
  ) {
    return this.managementReview
      .dashboard(user, query)
      .then((value) => ({
        criticalRisks: value.criticalRisks,
        escalations: value.escalations,
      }));
  }
  @Get("management-review/cycles")
  @Permissions("executive.management_review.cycle.view")
  managementReviewCycles(
    @CurrentUser() user: RequestUser,
    @Query() query: Row,
  ) {
    return this.managementReview.cycles(user, query);
  }
  @Post("management-review/cycles")
  @Permissions("executive.management_review.cycle.create")
  managementReviewCreateCycle(
    @CurrentUser() user: RequestUser,
    @Body() dto: Row,
  ) {
    return this.managementReview.createCycle(user, dto);
  }
  @Get("management-review/cycles/:cycleId")
  @Permissions("executive.management_review.cycle.view")
  managementReviewCycle(
    @CurrentUser() user: RequestUser,
    @Param("cycleId") id: string,
  ) {
    return this.managementReview.cycle(user, id);
  }
  @Patch("management-review/cycles/:cycleId")
  @Permissions("executive.management_review.cycle.edit")
  managementReviewUpdateCycle(
    @CurrentUser() user: RequestUser,
    @Param("cycleId") id: string,
    @Body() dto: Row,
  ) {
    return this.managementReview.updateCycle(user, id, dto);
  }
  @Post("management-review/cycles/:cycleId/activate")
  @Permissions("executive.management_review.cycle.activate")
  managementReviewCycleActivate(
    @CurrentUser() user: RequestUser,
    @Param("cycleId") id: string,
    @Body() dto: Row,
  ) {
    return this.managementReview.transitionCycle(user, id, "activate", dto);
  }
  @Post("management-review/cycles/:cycleId/complete")
  @Permissions("executive.management_review.cycle.complete")
  managementReviewCycleComplete(
    @CurrentUser() user: RequestUser,
    @Param("cycleId") id: string,
    @Body() dto: Row,
  ) {
    return this.managementReview.transitionCycle(user, id, "complete", dto);
  }
  @Post("management-review/cycles/:cycleId/reopen")
  @Permissions("executive.management_review.cycle.reopen")
  managementReviewCycleReopen(
    @CurrentUser() user: RequestUser,
    @Param("cycleId") id: string,
    @Body() dto: Row,
  ) {
    return this.managementReview.transitionCycle(user, id, "reopen", dto);
  }
  @Post("management-review/cycles/:cycleId/archive")
  @Permissions("executive.management_review.cycle.archive")
  managementReviewCycleArchive(
    @CurrentUser() user: RequestUser,
    @Param("cycleId") id: string,
    @Body() dto: Row,
  ) {
    return this.managementReview.transitionCycle(user, id, "archive", dto);
  }
  @Get("management-review/meetings")
  @Permissions("executive.management_review.meeting.view")
  managementReviewMeetings(
    @CurrentUser() user: RequestUser,
    @Query() query: Row,
  ) {
    return this.managementReview.meetings(user, query);
  }
  @Post("management-review/meetings")
  @Permissions("executive.management_review.meeting.create")
  managementReviewCreateMeeting(
    @CurrentUser() user: RequestUser,
    @Body() dto: Row,
  ) {
    return this.managementReview.createMeeting(user, dto);
  }
  @Get("management-review/meetings/:meetingId")
  @Permissions("executive.management_review.meeting.view")
  managementReviewMeeting(
    @CurrentUser() user: RequestUser,
    @Param("meetingId") id: string,
  ) {
    return this.managementReview.meeting(user, id);
  }
  @Patch("management-review/meetings/:meetingId")
  @Permissions("executive.management_review.meeting.edit")
  managementReviewUpdateMeeting(
    @CurrentUser() user: RequestUser,
    @Param("meetingId") id: string,
    @Body() dto: Row,
  ) {
    return this.managementReview.updateMeeting(user, id, dto);
  }
  @Post(
    "management-review/meetings/:meetingId/:action(schedule|start|adjourn|complete|cancel)",
  )
  managementReviewMeetingTransition(
    @CurrentUser() user: RequestUser,
    @Param("meetingId") id: string,
    @Param("action")
    action: "schedule" | "start" | "adjourn" | "complete" | "cancel",
    @Body() dto: Row,
  ) {
    return this.managementReview.meetingTransition(user, id, action, dto);
  }
  @Post("management-review/meetings/:meetingId/reschedule")
  @Permissions("executive.management_review.meeting.reschedule")
  managementReviewMeetingReschedule(
    @CurrentUser() user: RequestUser,
    @Param("meetingId") id: string,
    @Body() dto: Row,
  ) {
    return this.managementReview.rescheduleMeeting(user, id, dto);
  }
  @Get("management-review/meetings/:meetingId/participants")
  @Permissions("executive.management_review.meeting.view")
  managementReviewParticipants(
    @CurrentUser() user: RequestUser,
    @Param("meetingId") id: string,
  ) {
    return this.managementReview
      .meeting(user, id)
      .then((value) => value.participants);
  }
  @Post("management-review/meetings/:meetingId/participants")
  @Permissions("executive.management_review.meeting.edit")
  managementReviewAddParticipant(
    @CurrentUser() user: RequestUser,
    @Param("meetingId") id: string,
    @Body() dto: Row,
  ) {
    return this.managementReview.addParticipant(user, id, dto);
  }
  @Post("management-review/meetings/:meetingId/attendance")
  @Permissions("executive.management_review.meeting.record_attendance")
  managementReviewAttendance(
    @CurrentUser() user: RequestUser,
    @Param("meetingId") id: string,
    @Body() dto: Row,
  ) {
    return this.managementReview.attendance(user, id, dto);
  }
  @Get("management-review/meetings/:meetingId/agenda")
  @Permissions("executive.management_review.agenda.view")
  managementReviewAgenda(
    @CurrentUser() user: RequestUser,
    @Param("meetingId") id: string,
  ) {
    return this.managementReview.agenda(user, id);
  }
  @Post("management-review/meetings/:meetingId/agenda")
  @Permissions("executive.management_review.agenda.create")
  managementReviewAddAgenda(
    @CurrentUser() user: RequestUser,
    @Param("meetingId") id: string,
    @Body() dto: Row,
  ) {
    return this.managementReview.addAgenda(user, id, dto);
  }
  @Get("management-review/readiness")
  @Permissions("executive.management_review.readiness.view")
  managementReviewReadiness(
    @CurrentUser() user: RequestUser,
    @Query() query: Row,
  ) {
    return this.managementReview.readiness(user, query);
  }
  @Post("management-review/meetings/:meetingId/validate-readiness")
  @Permissions("executive.management_review.readiness.view")
  managementReviewValidateReadiness(
    @CurrentUser() user: RequestUser,
    @Param("meetingId") id: string,
  ) {
    return this.managementReview.readiness(user, { meetingId: id });
  }
  @Get("management-review/packages")
  @Permissions("executive.management_review.package.view")
  managementReviewPackages(
    @CurrentUser() user: RequestUser,
    @Query() query: Row,
  ) {
    return this.managementReview.packages(user, query);
  }
  @Post("management-review/packages")
  @Permissions("executive.management_review.package.create")
  managementReviewCreatePackage(
    @CurrentUser() user: RequestUser,
    @Body() dto: Row,
  ) {
    return this.managementReview.createPackage(user, dto);
  }
  @Get("management-review/packages/:packageId")
  @Permissions("executive.management_review.package.view")
  managementReviewPackage(
    @CurrentUser() user: RequestUser,
    @Param("packageId") id: string,
  ) {
    return this.managementReview.package(user, id);
  }
  @Post("management-review/packages/:packageId/validate")
  @Permissions("executive.management_review.readiness.view")
  managementReviewPackageValidate(
    @CurrentUser() user: RequestUser,
    @Param("packageId") id: string,
  ) {
    return this.managementReview.validatePackage(user, id);
  }
  @Post("management-review/packages/:packageId/generate")
  @Permissions("executive.management_review.package.generate")
  managementReviewPackageGenerate(
    @CurrentUser() user: RequestUser,
    @Param("packageId") id: string,
    @Body() dto: Row,
  ) {
    return this.managementReview.generatePackage(user, id, dto);
  }
  @Post("management-review/packages/:packageId/publish")
  @Permissions("executive.management_review.package.publish")
  managementReviewPackagePublish(
    @CurrentUser() user: RequestUser,
    @Param("packageId") id: string,
    @Body() dto: Row,
  ) {
    return this.managementReview.publishPackage(user, id, dto);
  }
  @Post("management-review/packages/:packageId/regenerate")
  @Permissions("executive.management_review.package.regenerate")
  managementReviewPackageRegenerate(
    @CurrentUser() user: RequestUser,
    @Param("packageId") id: string,
    @Body() dto: Row,
  ) {
    return this.managementReview.generatePackage(user, id, {
      ...dto,
      regenerate: true,
    });
  }
  @Get("management-review/packages/:packageId/versions")
  @Permissions("executive.management_review.package.view")
  managementReviewPackageVersions(
    @CurrentUser() user: RequestUser,
    @Param("packageId") id: string,
  ) {
    return this.managementReview.packageVersions(user, id);
  }
  @Get("management-review/packages/:packageId/access-log")
  @Permissions("executive.management_review.package.access_log.view")
  managementReviewPackageAccessLog(
    @CurrentUser() user: RequestUser,
    @Param("packageId") id: string,
  ) {
    return this.managementReview.packageAccessLog(user, id);
  }
  @Get("management-review/minutes")
  @Permissions("executive.management_review.minutes.view")
  managementReviewMinutes(
    @CurrentUser() user: RequestUser,
    @Query() query: Row,
  ) {
    return this.managementReview.minutes(user, query);
  }
  @Post("management-review/meetings/:meetingId/minutes")
  @Permissions("executive.management_review.minutes.create")
  managementReviewCreateMinutes(
    @CurrentUser() user: RequestUser,
    @Param("meetingId") id: string,
    @Body() dto: Row,
  ) {
    return this.managementReview.createMinutes(user, id, dto);
  }
  @Post("management-review/minutes/:minutesId/submit")
  @Permissions("executive.management_review.minutes.submit")
  managementReviewSubmitMinutes(
    @CurrentUser() user: RequestUser,
    @Param("minutesId") id: string,
    @Body() dto: Row,
  ) {
    return this.managementReview.submitMinutes(user, id, dto);
  }
  @Post("management-review/minutes/:minutesId/request-approval")
  @Permissions("executive.management_review.minutes.submit")
  managementReviewMinutesApproval(
    @CurrentUser() user: RequestUser,
    @Param("minutesId") id: string,
  ) {
    return this.managementReview.requestMinutesApproval(user, id);
  }
  @Get("management-review/minutes/:minutesId")
  @Permissions("executive.management_review.minutes.view")
  managementReviewSingleMinutes(
    @CurrentUser() user: RequestUser,
    @Param("minutesId") id: string,
  ) {
    return this.managementReview.singleMinutes(user, id);
  }
  @Patch("management-review/minutes/:minutesId")
  @Permissions("executive.management_review.minutes.edit")
  managementReviewUpdateMinutes(
    @CurrentUser() user: RequestUser,
    @Param("minutesId") id: string,
    @Body() dto: Row,
  ) {
    return this.managementReview.updateMinutes(user, id, dto);
  }
  @Get("management-review/decisions")
  @Permissions("executive.management_review.decision.view")
  managementReviewDecisions(
    @CurrentUser() user: RequestUser,
    @Query() query: Row,
  ) {
    return this.managementReview.decisions(user, query);
  }
  @Post("management-review/decisions")
  @Permissions("executive.management_review.decision.create")
  managementReviewCreateDecision(
    @CurrentUser() user: RequestUser,
    @Body() dto: Row,
  ) {
    return this.managementReview.createDecision(user, dto);
  }
  @Get("management-review/decisions/:decisionId")
  @Permissions("executive.management_review.decision.view")
  managementReviewSingleDecision(
    @CurrentUser() user: RequestUser,
    @Param("decisionId") id: string,
  ) {
    return this.managementReview.singleDecision(user, id);
  }
  @Patch("management-review/decisions/:decisionId")
  @Permissions("executive.management_review.decision.edit")
  managementReviewUpdateDecision(
    @CurrentUser() user: RequestUser,
    @Param("decisionId") id: string,
    @Body() dto: Row,
  ) {
    return this.managementReview.updateDecision(user, id, dto);
  }
  @Post("management-review/decisions/:decisionId/submit")
  @Permissions("executive.management_review.decision.submit")
  managementReviewSubmitDecision(
    @CurrentUser() user: RequestUser,
    @Param("decisionId") id: string,
  ) {
    return this.managementReview.submitDecision(user, id);
  }
  @Get("management-review/commitments")
  @Permissions("executive.management_review.commitment.view")
  managementReviewCommitments(
    @CurrentUser() user: RequestUser,
    @Query() query: Row,
  ) {
    return this.managementReview.commitments(user, query);
  }
  @Post("management-review/commitments")
  @Permissions("executive.management_review.commitment.create")
  managementReviewCreateCommitment(
    @CurrentUser() user: RequestUser,
    @Body() dto: Row,
  ) {
    return this.managementReview.createCommitment(user, dto);
  }
  @Get("management-review/commitments/:commitmentId")
  @Permissions("executive.management_review.commitment.view")
  managementReviewSingleCommitment(
    @CurrentUser() user: RequestUser,
    @Param("commitmentId") id: string,
  ) {
    return this.managementReview.singleCommitment(user, id);
  }
  @Patch("management-review/commitments/:commitmentId")
  @Permissions("executive.management_review.commitment.create")
  managementReviewUpdateCommitment(
    @CurrentUser() user: RequestUser,
    @Param("commitmentId") id: string,
    @Body() dto: Row,
  ) {
    return this.managementReview.updateCommitment(user, id, dto);
  }
  @Post("management-review/commitments/:commitmentId/assign")
  @Permissions("executive.management_review.commitment.assign")
  managementReviewAssignCommitment(
    @CurrentUser() user: RequestUser,
    @Param("commitmentId") id: string,
    @Body() dto: Row,
  ) {
    return this.managementReview.assignCommitment(user, id, dto.ownerId, dto.note);
  }
  @Post("management-review/commitments/:commitmentId/request-verification")
  @Permissions("executive.management_review.commitment.verify")
  managementReviewCommitmentRequestVerification(
    @CurrentUser() user: RequestUser,
    @Param("commitmentId") id: string,
    @Body() dto: Row,
  ) {
    return this.managementReview.requestCommitmentVerification(
      user,
      id,
      dto.verifierId,
      dto.criteria
    );
  }
  @Post("management-review/commitments/:commitmentId/create-action")
  @Permissions("executive.management_review.commitment.assign")
  managementReviewCommitmentAction(
    @CurrentUser() user: RequestUser,
    @Param("commitmentId") id: string,
  ) {
    return this.managementReview.createCommitmentAction(user, id);
  }
  @Post("management-review/commitments/:commitmentId/carry-forward")
  @Permissions("executive.management_review.commitment.carry_forward")
  managementReviewCarryForward(
    @CurrentUser() user: RequestUser,
    @Param("commitmentId") id: string,
    @Body() dto: Row,
  ) {
    return this.managementReview.carryForward(user, id, dto);
  }
  @Get("management-review/follow-up")
  @Permissions("executive.management_review.commitment.view")
  managementReviewFollowUp(
    @CurrentUser() user: RequestUser,
    @Query() query: Row,
  ) {
    return this.managementReview.followUp(user, query);
  }
  @Get("management-review/carried-forward")
  @Permissions("executive.management_review.commitment.view")
  managementReviewCarriedForwardList(
    @CurrentUser() user: RequestUser,
    @Query() query: Row,
  ) {
    return this.managementReview.carriedForwardList(user, query);
  }
  @Get("management-review/history")
  @Permissions("executive.management_review.history.view")
  managementReviewHistory(
    @CurrentUser() user: RequestUser,
    @Query() query: Row,
  ) {
    return this.managementReview.historyFeed(user, query);
  }
  @Get("management-review/calendar")
  @Permissions("executive.management_review.meeting.view")
  managementReviewCalendar(
    @CurrentUser() user: RequestUser,
    @Query() query: Row,
  ) {
    return this.managementReview.calendar(user, query);
  }
  @Get("management-review/templates")
  @Permissions("executive.management_review.agenda.template.manage")
  managementReviewTemplates(
    @CurrentUser() user: RequestUser,
    @Query() query: Row,
  ) {
    return this.managementReview.templates(user, query);
  }
  @Post("management-review/templates")
  @Permissions("executive.management_review.agenda.template.manage")
  managementReviewCreateTemplate(
    @CurrentUser() user: RequestUser,
    @Body() dto: Row,
  ) {
    return this.managementReview.saveTemplate(user, dto);
  }
  @Patch("management-review/templates/:templateId")
  @Permissions("executive.management_review.agenda.template.manage")
  managementReviewUpdateTemplate(
    @CurrentUser() user: RequestUser,
    @Param("templateId") id: string,
    @Body() dto: Row,
  ) {
    return this.managementReview.saveTemplate(user, dto, id);
  }
  @Get("management-review/settings")
  @Permissions("executive.management_review.settings.view")
  managementReviewSettings(
    @CurrentUser() user: RequestUser,
    @Query() query: Row,
  ) {
    return this.managementReview.settings(user, query);
  }
  @Put("management-review/settings")
  @Permissions("executive.management_review.settings.edit")
  managementReviewSaveSettings(
    @CurrentUser() user: RequestUser,
    @Body() dto: Row,
  ) {
    return this.managementReview.saveSettings(user, dto);
  }

  @Get('trends/dashboard') @Permissions('executive.trend.dashboard.view') trendsDashboard(@CurrentUser() user: RequestUser, @Query() query: Row) { return this.trends.dashboard(user, query); }
  @Get('trends/dashboard/:view') @Permissions('executive.trend.dashboard.view') trendsDashboardView(@CurrentUser() user: RequestUser, @Param('view') view: string, @Query() query: Row) { return this.trends.operational(user, view, query); }
  @Get('trends/explorer') @Permissions('executive.trend.explorer.view') trendExplorer(@CurrentUser() user: RequestUser, @Query() query: Row) { return this.trends.explorer(user, query); }
  @Get('trends/runs') @Permissions('executive.trend.run.view') trendRuns(@CurrentUser() user: RequestUser, @Query() query: Row) { return this.trends.listRuns(user, query); }
  @Post('trends/runs') @Permissions('executive.trend.run.create') createTrendRun(@CurrentUser() user: RequestUser, @Body() dto: Row) { return this.trends.createRun(user, dto); }
  @Get('trends/runs/:runId') @Permissions('executive.trend.run.view') trendRun(@CurrentUser() user: RequestUser, @Param('runId') id: string) { return this.trends.runDetail(user, id); }
  @Get('trends/runs/:runId/:view(series|sources|methodology|explainability|history)') @Permissions('executive.trend.run.view') trendRunView(@CurrentUser() user: RequestUser, @Param('runId') id: string) { return this.trends.runDetail(user, id); }
  @Post('trends/runs/:runId/recalculate') @Permissions('executive.trend.run.recalculate') recalculateTrendRun(@CurrentUser() user: RequestUser, @Param('runId') id: string, @Body() dto: Row) { return this.trends.recalculate(user, id, dto); }
  @Post('trends/runs/:runId/cancel') @Permissions('executive.trend.run.cancel') cancelTrendRun(@CurrentUser() user: RequestUser, @Param('runId') id: string) { return this.trends.cancelRun(user, id); }
  @Post('trends/runs/:runId/archive') @Permissions('executive.trend.run.archive') archiveTrendRun(@CurrentUser() user: RequestUser, @Param('runId') id: string, @Body() dto: Row) { return this.trends.archiveRun(user, id, dto); }

  @Get('trends/repeat-issues') @Permissions('executive.trend.repeat_issue.view') repeatIssues(@CurrentUser() user: RequestUser, @Query() query: Row) { return this.trends.repeatIssues(user, query); }
  @Post('trends/repeat-issues/detect') @Permissions('executive.trend.repeat_issue.detect') detectRepeatIssues(@CurrentUser() user: RequestUser, @Body() dto: Row) { return this.trends.detectRepeats(user, dto); }
  @Get('trends/repeat-issues/:repeatId') @Permissions('executive.trend.repeat_issue.view') repeatIssue(@CurrentUser() user: RequestUser, @Param('repeatId') id: string) { return this.trends.repeatDetail(user, id); }
  @Get('trends/repeat-issues/:repeatId/:view(occurrences|match-explanation|actions|history)') @Permissions('executive.trend.repeat_issue.view') repeatIssueView(@CurrentUser() user: RequestUser, @Param('repeatId') id: string) { return this.trends.repeatDetail(user, id); }
  @Post('trends/repeat-issues/:repeatId/confirm') @Permissions('executive.trend.repeat_issue.confirm') confirmRepeatIssue(@CurrentUser() user: RequestUser, @Param('repeatId') id: string, @Body() dto: Row) { return this.trends.reviewRepeat(user, id, 'Confirmed Repeat', dto); }
  @Post('trends/repeat-issues/:repeatId/reject') @Permissions('executive.trend.repeat_issue.reject') rejectRepeatIssue(@CurrentUser() user: RequestUser, @Param('repeatId') id: string, @Body() dto: Row) { return this.trends.reviewRepeat(user, id, 'Rejected', dto); }
  @Post('trends/repeat-issues/:repeatId/create-action') @Permissions('executive.trend.repeat_issue.create_action') createRepeatIssueAction(@CurrentUser() user: RequestUser, @Param('repeatId') id: string, @Body() dto: Row) { return this.trends.createRepeatAction(user, id, dto); }
  @Post('trends/repeat-issues/:repeatId/add-to-management-review') @Permissions('executive.trend.management_review_candidate.create') addRepeatToManagementReview(@CurrentUser() user: RequestUser, @Param('repeatId') id: string) { return this.trends.addToManagementReview(user, 'repeat', id); }

  @Get('trends/alerts') @Permissions('executive.trend.alert.view') trendAlerts(@CurrentUser() user: RequestUser, @Query() query: Row) { return this.trends.alerts(user, query); }
  @Post('trends/alerts/:alertId/acknowledge') @Permissions('executive.trend.alert.acknowledge') acknowledgeTrendAlert(@CurrentUser() user: RequestUser, @Param('alertId') id: string) { return this.trends.acknowledgeAlert(user, id); }
  @Post('trends/alerts/:alertId/resolve') @Permissions('executive.trend.alert.resolve') resolveTrendAlert(@CurrentUser() user: RequestUser, @Param('alertId') id: string, @Body() dto: Row) { return this.trends.resolveAlert(user, id, dto); }
  @Get('trends/insights') @Permissions('executive.trend.insight.view') trendInsights(@CurrentUser() user: RequestUser, @Query() query: Row) { return this.trends.insights(user, query); }
  @Post('trends/insights/:insightId/review') @Permissions('executive.trend.insight.review') reviewTrendInsight(@CurrentUser() user: RequestUser, @Param('insightId') id: string, @Body() dto: Row) { return this.trends.reviewInsight(user, id, dto); }
  @Post('trends/insights/:insightId/dismiss') @Permissions('executive.trend.insight.review') dismissTrendInsight(@CurrentUser() user: RequestUser, @Param('insightId') id: string, @Body() dto: Row) { return this.trends.reviewInsight(user, id, { ...dto, dismiss: true }); }
  @Post('trends/insights/:insightId/add-to-management-review') @Permissions('executive.trend.management_review_candidate.create') addInsightToManagementReview(@CurrentUser() user: RequestUser, @Param('insightId') id: string) { return this.trends.addToManagementReview(user, 'insight', id); }
  @Post('trends/alerts/:alertId/escalate') @Permissions('executive.trend.alert.resolve') alertEscalation(@CurrentUser() user: RequestUser, @Param('alertId') id: string) { return this.trends.escalateAlert(user, id); }
  @Get('trends/alert-rules') @Permissions('executive.trend.alert_rule.view') trendAlertRules(@CurrentUser() user: RequestUser, @Query() query: Row) { return this.trends.alertRules(user, query); }
  @Get('trends/alert-rules/:ruleId') @Permissions('executive.trend.alert_rule.view') trendAlertRule(@CurrentUser() user: RequestUser, @Param('ruleId') id: string) { return this.trends.alertRule(user, id); }
  @Post('trends/alert-rules') @Permissions('executive.trend.alert_rule.manage') createTrendAlertRule(@CurrentUser() user: RequestUser, @Body() dto: Row) { return this.trends.saveAlertRule(user, dto); }
  @Patch('trends/alert-rules/:ruleId') @Permissions('executive.trend.alert_rule.manage') updateTrendAlertRule(@CurrentUser() user: RequestUser, @Param('ruleId') id: string, @Body() dto: Row) { return this.trends.saveAlertRule(user, dto, id); }
  @Post('trends/alert-rules/:ruleId/test') @Permissions('executive.trend.alert_rule.manage') testTrendAlertRule(@CurrentUser() user: RequestUser, @Param('ruleId') id: string, @Body() dto: Row) { return this.trends.testAlertRule(user, id, dto); }

  @Get('trends/methodology') @Permissions('executive.trend.methodology.view') trendMethodology(@CurrentUser() user: RequestUser) { return this.trends.methodology(user); }
  @Get('trends/settings') @Permissions('executive.trend.settings.view') trendSettings(@CurrentUser() user: RequestUser) { return this.trends.settings(user); }
  @Patch('trends/settings') @Permissions('executive.trend.settings.edit') saveTrendSettings(@CurrentUser() user: RequestUser, @Body() dto: Row) { return this.trends.saveSettings(user, dto); }
  @Get('trends/compare') @Permissions('executive.trend.compare.view') trendCompare(@CurrentUser() user: RequestUser, @Query() query: Row) { return this.trends.comparisons(user, query); }
  @Post('trends/compare') @Permissions('executive.trend.compare.view') createTrendComparison(@CurrentUser() user: RequestUser, @Body() dto: Row) { return this.trends.comparisons(user, dto); }
  @Get('trends/kpis/:kpiCode/:view(series|comparison|methodology|source-trace)') @Permissions('executive.trend.kpi.view') trendKpiView(@CurrentUser() user: RequestUser, @Param('kpiCode') kpiCode: string, @Query() query: Row) { return this.trends.operational(user, 'kpis', { ...query, kpiCode }); }
  @Get('trends/kpis/:kpiCode') @Permissions('executive.trend.kpi.view') trendKpi(@CurrentUser() user: RequestUser, @Param('kpiCode') kpiCode: string, @Query() query: Row) { return this.trends.operational(user, 'kpis', { ...query, kpiCode }); }
  @Get('trends/recurring-issues/clusters') @Permissions('executive.trend.recurring_cluster.view') recurringClusters(@CurrentUser() user: RequestUser, @Query() query: Row) { return this.trends.recurringClusters(user, query); }
  @Get('trends/recurring-issues/clusters/:clusterId') @Permissions('executive.trend.recurring_cluster.view') recurringCluster(@CurrentUser() user: RequestUser, @Param('clusterId') id: string) { return this.trends.clusterDetail(user, id); }
  @Post('trends/recurring-issues/clusters/:clusterId/review') @Permissions('executive.trend.recurring_cluster.manage') reviewRecurringCluster(@CurrentUser() user: RequestUser, @Param('clusterId') id: string, @Body() dto: Row) { return this.trends.reviewCluster(user, id, dto); }
  @Post('trends/recurring-issues/clusters/:clusterId/add-to-management-review') @Permissions('executive.trend.management_review_candidate.create') addClusterToManagementReview(@CurrentUser() user: RequestUser, @Param('clusterId') id: string) { return this.trends.addClusterToManagementReview(user, id); }
  @Get('trends/recurring-issues/:view(cross-site|by-element|by-module)') @Permissions('executive.trend.recurring_cluster.view') recurringClusterView(@CurrentUser() user: RequestUser, @Query() query: Row) { return this.trends.recurringClusters(user, query); }
  @Get('trends/escalations/:view(levels|sla|acknowledgments|resolution-aging|repeated)') @Permissions('executive.trend.escalation.view') escalationTrendView(@CurrentUser() user: RequestUser, @Query() query: Row) { return this.trends.operational(user, 'escalations', query); }
  @Get('trends/management-review/:view(meetings|decisions|commitments|carry-forward)') @Permissions('executive.trend.management_review.view') managementReviewTrendView(@CurrentUser() user: RequestUser, @Query() query: Row) { return this.trends.operational(user, 'management-review', query); }
  @Get('trends/alerts/:alertId') @Permissions('executive.trend.alert.view') trendAlert(@CurrentUser() user: RequestUser, @Param('alertId') id: string, @Query() query: Row) { return this.trends.alerts(user, { ...query, id }); }
  @Get('trends/insights/:insightId') @Permissions('executive.trend.insight.view') trendInsight(@CurrentUser() user: RequestUser, @Param('insightId') id: string, @Query() query: Row) { return this.trends.insights(user, { ...query, id }); }
  @Get('trends/:section(kpis|modules|psm-elements|sites|units|departments|heatmap|critical-risks|critical-barriers|overdue-actions|action-aging|action-extensions|capa-effectiveness|stale-records|escalations|management-review|worsening|recurring-issues|jobs|snapshots)') trendSection(@CurrentUser() user: RequestUser, @Param('section') section: string, @Query() query: Row) { return this.trends.operational(user, section, query); }
  @Get('trends/:section(kpis|modules|psm-elements|sites|units|departments|recurring-issues)/:id') trendSectionDetail(@CurrentUser() user: RequestUser, @Param('section') section: string, @Param('id') id: string, @Query() query: Row) { return this.trends.operational(user, section, { ...query, id }); }

  @Get('reports/lookups') @Permissions('executive.report.register.view') reportLookups(@CurrentUser() user: RequestUser) { return this.reports.lookups(user); }
  @Get('reports/board/dashboard') @Permissions('executive.report.board.view') boardDashboard(@CurrentUser() user: RequestUser, @Query() query: Row) { return this.reports.boardDashboard(user, query); }
  @Get('reports/board/packages') @Permissions('executive.report.board.view') boardPackages(@CurrentUser() user: RequestUser, @Query() query: Row) { return this.reports.boardPackages(user, query); }
  @Post('reports/board/packages') @Permissions('executive.report.board.create') createBoardPackage(@CurrentUser() user: RequestUser, @Body() dto: Row) { return this.reports.createBoardPackage(user, dto); }

  @Get('reports/dashboard') @Permissions('executive.report.dashboard.view') reportDashboard(@CurrentUser() user: RequestUser, @Query() query: Row) { return this.reports.dashboard(user, query); }
  @Get('reports') @Permissions('executive.report.register.view') reportRegister(@CurrentUser() user: RequestUser, @Query() query: Row) { return this.reports.reports(user, query); }
  @Post('reports') @Permissions('executive.report.create') createExecutiveReport(@CurrentUser() user: RequestUser, @Body() dto: Row) { return this.reports.create(user, dto); }
  @Get('reports/templates') @Permissions('executive.report.template.view') reportTemplates(@CurrentUser() user: RequestUser) { return this.reports.templates(user); }
  @Get('reports/types') @Permissions('executive.report.create') reportTypes(@CurrentUser() user: RequestUser) { return this.reports.types(user); }
  @Get('reports/periods') @Permissions('executive.report.period.view') reportPeriods(@CurrentUser() user: RequestUser, @Query() query: Row) { return this.reports.periods(user, query); }
  @Get('reports/audiences') @Permissions('executive.report.audience.view') reportAudiences(@CurrentUser() user: RequestUser) { return this.reports.audiences(user); }
  @Post('reports/templates') @Permissions('executive.report.template.manage') createReportTemplate(@CurrentUser() user: RequestUser, @Body() dto: Row) { return this.reports.saveTemplate(user, dto); }
  @Patch('reports/templates/:templateId') @Permissions('executive.report.template.manage') updateReportTemplate(@CurrentUser() user: RequestUser, @Param('templateId') id: string, @Body() dto: Row) { return this.reports.saveTemplate(user, dto, id); }
  @Post('reports/periods') @Permissions('executive.report.period.manage') createReportPeriod(@CurrentUser() user: RequestUser, @Body() dto: Row) { return this.reports.savePeriod(user, dto); }
  @Patch('reports/periods/:periodId') @Permissions('executive.report.period.manage') updateReportPeriod(@CurrentUser() user: RequestUser, @Param('periodId') id: string, @Body() dto: Row) { return this.reports.savePeriod(user, dto, id); }
  @Post('reports/audiences') @Permissions('executive.report.audience.manage') createReportAudience(@CurrentUser() user: RequestUser, @Body() dto: Row) { return this.reports.saveAudience(user, dto); }
  @Patch('reports/audiences/:audienceId') @Permissions('executive.report.audience.manage') updateReportAudience(@CurrentUser() user: RequestUser, @Param('audienceId') id: string, @Body() dto: Row) { return this.reports.saveAudience(user, dto, id); }
  @Get('reports/schedules') @Permissions('executive.report.schedule.view') reportSchedules(@CurrentUser() user: RequestUser) { return this.reports.schedules(user); }
  @Post('reports/schedules') @Permissions('executive.report.schedule.manage') createReportSchedule(@CurrentUser() user: RequestUser, @Body() dto: Row) { return this.reports.saveSchedule(user, dto); }
  @Patch('reports/schedules/:scheduleId') @Permissions('executive.report.schedule.manage') updateReportSchedule(@CurrentUser() user: RequestUser, @Param('scheduleId') id: string, @Body() dto: Row) { return this.reports.saveSchedule(user, dto, id); }
  @Get('reports/artifacts/:artifactId/download') @Permissions('executive.report.artifact.download') downloadReportArtifact(@CurrentUser() user: RequestUser, @Param('artifactId') artifactId: string) { return this.reports.download(user, artifactId); }
  @Get('reports/:reportId') @Permissions('executive.report.detail.view') reportDetail(@CurrentUser() user: RequestUser, @Param('reportId') reportId: string) { return this.reports.detail(user, reportId); }
  @Patch('reports/:reportId') @Permissions('executive.report.edit') updateExecutiveReport(@CurrentUser() user: RequestUser, @Param('reportId') reportId: string, @Body() dto: Row) { return this.reports.update(user, reportId, dto); }
  @Post('reports/:reportId/validate') @Permissions('executive.report.validate') validateExecutiveReport(@CurrentUser() user: RequestUser, @Param('reportId') reportId: string) { return this.reports.validate(user, reportId); }
  @Post('reports/:reportId/generate') @Permissions('executive.report.generate') generateExecutiveReport(@CurrentUser() user: RequestUser, @Param('reportId') reportId: string, @Body() dto: Row) { return this.reports.generate(user, reportId, dto); }
  @Post('reports/:reportId/archive') @Permissions('executive.report.archive') archiveExecutiveReport(@CurrentUser() user: RequestUser, @Param('reportId') reportId: string, @Body() dto: Row) { return this.reports.archive(user, reportId, dto); }
  @Get('reports/:reportId/contents') @Permissions('executive.report.detail.view') reportContents(@CurrentUser() user: RequestUser, @Param('reportId') reportId: string) { return this.reports.contents(user, reportId); }
  @Get('reports/:reportId/sources') @Permissions('executive.report.source_trace.view') reportSources(@CurrentUser() user: RequestUser, @Param('reportId') reportId: string) { return this.reports.sources(user, reportId); }
  @Get('reports/:reportId/readiness') @Permissions('executive.report.validate') reportReadiness(@CurrentUser() user: RequestUser, @Param('reportId') reportId: string) { return this.reports.readiness(user, reportId); }
  @Get('reports/:reportId/preview') @Permissions('executive.report.preview') reportPreview(@CurrentUser() user: RequestUser, @Param('reportId') reportId: string) { return this.reports.preview(user, reportId); }
  @Post('reports/:reportId/submit-approval') @Permissions('executive.report.approval.submit') submitReportApproval(@CurrentUser() user: RequestUser, @Param('reportId') reportId: string, @Body() dto: Row) { return this.reports.submitApproval(user, reportId, dto); }
  @Post('reports/:reportId/approve') @Permissions('executive.report.approval.view') approveReport(@CurrentUser() user: RequestUser, @Param('reportId') reportId: string, @Body() dto: Row) { return this.reports.approve(user, reportId, dto); }
  @Post('reports/:reportId/reject') @Permissions('executive.report.approval.view') rejectReport(@CurrentUser() user: RequestUser, @Param('reportId') reportId: string, @Body() dto: Row) { return this.reports.reject(user, reportId, dto); }
  @Post('reports/:reportId/publish') @Permissions('executive.report.publish') publishReport(@CurrentUser() user: RequestUser, @Param('reportId') reportId: string, @Body() dto: Row) { return this.reports.publish(user, reportId, dto); }
  @Post('reports/:reportId/create-version') @Permissions('executive.report.create') createReportVersion(@CurrentUser() user: RequestUser, @Param('reportId') reportId: string, @Body() dto: Row) { return this.reports.createVersion(user, reportId, dto); }
  @Get('reports/:reportId/artifacts') @Permissions('executive.report.artifact.view') reportArtifacts(@CurrentUser() user: RequestUser, @Param('reportId') reportId: string) { return this.reports.artifacts(user, reportId); }
  @Get('reports/:reportId/versions') @Permissions('executive.report.history.view') reportVersions(@CurrentUser() user: RequestUser, @Param('reportId') reportId: string) { return this.reports.versions(user, reportId); }
  @Get('reports/:reportId/history') @Permissions('executive.report.history.view') reportHistory(@CurrentUser() user: RequestUser, @Param('reportId') reportId: string) { return this.reports.historyRows(user, reportId); }
  @Get('reports/:reportId/distribution') @Permissions('executive.report.distribution.view') reportDistribution(@CurrentUser() user: RequestUser, @Param('reportId') reportId: string) { return this.reports.distribution(user, reportId); }
  @Post('reports/:reportId/distribution/send') @Permissions('executive.report.distribution.manage') sendReportDistribution(@CurrentUser() user: RequestUser, @Param('reportId') reportId: string, @Body() dto: Row) { return this.reports.sendDistribution(user, reportId, dto); }
  @Post('reports/distribution/:distributionId/revoke') @Permissions('executive.report.distribution.manage') revokeReportDistribution(@CurrentUser() user: RequestUser, @Param('distributionId') distributionId: string, @Body() dto: Row) { return this.reports.revokeDistribution(user, distributionId, dto); }
  @Get('reports/:reportId/staleness') @Permissions('executive.report.detail.view') reportStaleness(@CurrentUser() user: RequestUser, @Param('reportId') reportId: string) { return this.reports.staleness(user, reportId); }
  @Post('reports/:reportId/release-variants') @Permissions('executive.report.publish') createReportReleaseVariant(@CurrentUser() user: RequestUser, @Param('reportId') reportId: string, @Body() dto: Row) { return this.reports.createReleaseVariant(user, reportId, dto); }
  private performanceType(value: string) {
    return value === "equipment"
      ? "equipment"
      : (value.slice(0, -1) as "site" | "department" | "unit" | "area");
  }
}
type Row = Record<string, any>;
