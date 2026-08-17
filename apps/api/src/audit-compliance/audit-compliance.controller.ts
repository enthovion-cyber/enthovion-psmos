import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
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
import { auditPermissions } from "./audit-compliance.constants";
import { AuditDashboardService } from "./audit-dashboard.service";
import { AuditLookupService } from "./audit-lookup.service";
import { AuditPlanService } from "./audit-plan.service";
import { AuditPlanSettingsService } from "./audit-plan-settings.service";
import { AuditProgramService } from "./audit-program.service";
import { AuditSettingsService } from "./audit-settings.service";
import { AuditChecklistService } from "./audit-checklist.service";
import { AuditExecutionService } from "./audit-execution.service";
import { AuditCapaService } from "./audit-capa.service";
import { AuditEvidenceService } from "./audit-evidence.service";
import { AuditFindingService } from "./audit-finding.service";
import { AuditScoringService } from "./audit-scoring.service";
import { AuditStandardMappingService } from "./audit-standard-mapping.service";
import { AuditReviewApprovalService } from "./audit-review-approval.service";
import { AuditReportService } from "./audit-report.service";
import { AuditHistoryTrendService } from "./audit-history-trend.service";
import { RegulatoryService } from "../regulatory/regulatory.service";

@UseGuards(JwtAuthGuard, SiteGuard, PermissionsGuard)
@Controller("audit-compliance")
export class AuditComplianceController {
  constructor(
    private readonly dashboardService: AuditDashboardService,
    private readonly programs: AuditProgramService,
    private readonly lookups: AuditLookupService,
    private readonly settingsService: AuditSettingsService,
    private readonly plans: AuditPlanService,
    private readonly planSettings: AuditPlanSettingsService,
    private readonly checklists: AuditChecklistService,
    private readonly executions: AuditExecutionService,
    private readonly capa: AuditCapaService,
    private readonly evidence: AuditEvidenceService,
    private readonly findings: AuditFindingService,
    private readonly scoring: AuditScoringService,
    private readonly standardsMapping: AuditStandardMappingService,
    private readonly reviewApproval: AuditReviewApprovalService,
    private readonly reports: AuditReportService,
    private readonly historyTrends: AuditHistoryTrendService,
    private readonly regulatory: RegulatoryService,
  ) {}

  @Get("programs/:programId/regulatory-mapping")
  @Permissions("regulatory.audit_mapping.view")
  programRegulatoryMapping(@CurrentUser() user: RequestUser, @Param("programId") programId: string, @Query() query: Record<string, any>) { return this.regulatory.auditSourceRegulatoryMapping(this.regulatoryScope(user), "auditProgramId", programId, query, user.permissions); }

  @Get("plans/:planId/regulatory-mapping")
  @Permissions("regulatory.audit_mapping.view")
  planRegulatoryMapping(@CurrentUser() user: RequestUser, @Param("planId") planId: string, @Query() query: Record<string, any>) { return this.regulatory.auditSourceRegulatoryMapping(this.regulatoryScope(user), "auditPlanId", planId, query, user.permissions); }

  @Get("checklists/:checklistId/regulatory-mapping")
  @Permissions("regulatory.audit_mapping.view")
  checklistRegulatoryMapping(@CurrentUser() user: RequestUser, @Param("checklistId") checklistId: string, @Query() query: Record<string, any>) { return this.regulatory.auditSourceRegulatoryMapping(this.regulatoryScope(user), "auditChecklistId", checklistId, query, user.permissions); }

  @Get("execution/:executionId/regulatory-mapping")
  @Permissions("regulatory.audit_mapping.view")
  executionRegulatoryMapping(@CurrentUser() user: RequestUser, @Param("executionId") executionId: string, @Query() query: Record<string, any>) { return this.regulatory.auditSourceRegulatoryMapping(this.regulatoryScope(user), "auditExecutionId", executionId, query, user.permissions); }

  @Get("findings/:findingId/regulatory-mapping")
  @Permissions("regulatory.audit_mapping.view")
  findingRegulatoryMapping(@CurrentUser() user: RequestUser, @Param("findingId") findingId: string, @Query() query: Record<string, any>) { return this.regulatory.auditSourceRegulatoryMapping(this.regulatoryScope(user), "auditFindingId", findingId, query, user.permissions); }

  @Get("capa/:capaId/regulatory-mapping")
  @Permissions("regulatory.audit_mapping.view")
  capaRegulatoryMapping(@CurrentUser() user: RequestUser, @Param("capaId") capaId: string, @Query() query: Record<string, any>) { return this.regulatory.auditSourceRegulatoryMapping(this.regulatoryScope(user), "auditCapaId", capaId, query, user.permissions); }

  @Get("capa/:capaId/regulatory-links")
  @Permissions("regulatory.action.view")
  capaRegulatoryLinks(@CurrentUser() user: RequestUser, @Param("capaId") capaId: string) { return this.regulatory.auditCapaRegulatoryLinks(this.regulatoryScope(user), capaId, user.permissions); }

  @Get("capa/:capaId/regulatory-compliance-gaps")
  @Permissions("regulatory.action.view")
  capaRegulatoryComplianceGaps(@CurrentUser() user: RequestUser, @Param("capaId") capaId: string) { return this.regulatory.auditCapaRegulatoryLinks(this.regulatoryScope(user), capaId, user.permissions); }

  @Get("capa/:capaId/regulatory-readiness")
  @Permissions("regulatory.action.closure_readiness.view")
  capaRegulatoryReadiness(@CurrentUser() user: RequestUser, @Param("capaId") capaId: string) { return this.regulatory.auditCapaRegulatoryReadiness(this.regulatoryScope(user), capaId, user.permissions); }

  @Get("evidence/:evidenceId/regulatory-mapping")
  @Permissions("regulatory.audit_mapping.view")
  evidenceRegulatoryMapping(@CurrentUser() user: RequestUser, @Param("evidenceId") evidenceId: string, @Query() query: Record<string, any>) { return this.regulatory.auditSourceRegulatoryMapping(this.regulatoryScope(user), "auditEvidenceId", evidenceId, query, user.permissions); }

  @Get("scoring/runs/:runId/regulatory-mapping")
  @Permissions("regulatory.audit_mapping.view")
  scoreRunRegulatoryMapping(@CurrentUser() user: RequestUser, @Param("runId") runId: string, @Query() query: Record<string, any>) { return this.regulatory.auditSourceRegulatoryMapping(this.regulatoryScope(user), "auditScoreRunId", runId, query, user.permissions); }

  @Get("standards-mapping/:mappingId/regulatory-mapping")
  @Permissions("regulatory.audit_mapping.view")
  standardMappingRegulatoryMapping(@CurrentUser() user: RequestUser, @Param("mappingId") mappingId: string, @Query() query: Record<string, any>) { return this.regulatory.auditSourceRegulatoryMapping(this.regulatoryScope(user), "auditStandardsMappingId", mappingId, query, user.permissions); }

  private regulatoryScope(user: RequestUser) {
    return {
      companyId: user.tenantId,
      selectedSiteId: user.selectedSiteId ?? user.activeSiteId ?? null,
      siteIds: user.siteIds,
      corporateView: user.corporateView,
      isCompanyAdmin: user.isCompanyAdmin,
      isSiteAdmin: user.isSiteAdmin
    };
  }

  @Get("history/dashboard")
  @Permissions(auditPermissions.historyDashboardView)
  historyDashboard(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.historyTrends.dashboard(user, query); }
  @Get("history/dashboard/summary")
  @Permissions(auditPermissions.historyDashboardView)
  historyDashboardSummary(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.historyTrends.dashboardSummary(user, query); }
  @Get("history/dashboard/repeat-findings")
  @Permissions(auditPermissions.repeatFindingView)
  historyDashboardRepeatFindings(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.historyTrends.repeatFindings(user, query); }
  @Get("history/dashboard/capa-effectiveness")
  @Permissions(auditPermissions.trendDashboardView)
  historyDashboardCapaEffectiveness(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.historyTrends.trendView(user, "CAPA Effectiveness Trend", query); }
  @Get("history/dashboard/evidence-gaps")
  @Permissions(auditPermissions.trendDashboardView)
  historyDashboardEvidenceGaps(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.historyTrends.trendView(user, "Evidence Gap Trend", query); }
  @Get("history/dashboard/score-trends")
  @Permissions(auditPermissions.trendDashboardView)
  historyDashboardScoreTrends(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.historyTrends.trendView(user, "Compliance Score Trend", query); }
  @Get("history/dashboard/recent")
  @Permissions(auditPermissions.historyDashboardView)
  historyDashboardRecent(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.historyTrends.unifiedEvents(user, { ...query, limit: query.limit ?? 20 }); }

  @Get("history/timeline")
  @Permissions(auditPermissions.historyTimelineView)
  historyTimeline(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.historyTrends.unifiedEvents(user, query); }
  @Get("history/activity")
  @Permissions(auditPermissions.historyActivityView)
  historyActivity(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.historyTrends.activity(user, query); }
  @Get("history/snapshots")
  @Permissions(auditPermissions.historySnapshotView)
  historySnapshots(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.historyTrends.snapshots(user, query); }
  @Get("history/by-site")
  @Permissions(auditPermissions.historyView)
  historyBySite(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.historyTrends.dimensionHistory(user, "by-site", query); }
  @Get("history/by-unit")
  @Permissions(auditPermissions.historyView)
  historyByUnit(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.historyTrends.dimensionHistory(user, "by-unit", query); }
  @Get("history/by-module")
  @Permissions(auditPermissions.historyView)
  historyByModule(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.historyTrends.dimensionHistory(user, "by-module", query); }
  @Get("history/by-standard")
  @Permissions(auditPermissions.historyView)
  historyByStandard(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.historyTrends.dimensionHistory(user, "by-standard", query); }
  @Get("history/by-clause")
  @Permissions(auditPermissions.historyView)
  historyByClause(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.historyTrends.dimensionHistory(user, "by-clause", query); }
  @Get("history/by-owner")
  @Permissions(auditPermissions.historyView)
  historyByOwner(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.historyTrends.dimensionHistory(user, "by-owner", query); }
  @Get("history/by-equipment")
  @Permissions(auditPermissions.historyView)
  historyByEquipment(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.historyTrends.dimensionHistory(user, "by-equipment", query); }
  @Get("history/by-department")
  @Permissions(auditPermissions.historyView)
  historyByDepartment(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.historyTrends.dimensionHistory(user, "by-department", query); }

  @Get("history/trends")
  @Permissions(auditPermissions.trendView)
  historyTrendsLanding(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.historyTrends.trendRuns(user, query); }
  @Post("history/trends/runs")
  @Permissions(auditPermissions.trendRunCreate)
  createTrendRun(@CurrentUser() user: RequestUser, @Body() dto: Record<string, any>) { return this.historyTrends.createTrendRun(user, dto); }
  @Get("history/trends/runs")
  @Permissions(auditPermissions.trendView)
  trendRuns(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.historyTrends.trendRuns(user, query); }
  @Get("history/trends/runs/:trendRunId")
  @Permissions(auditPermissions.trendView)
  trendRunDetail(@CurrentUser() user: RequestUser, @Param("trendRunId") trendRunId: string) { return this.historyTrends.trendRunDetail(user, trendRunId); }
  @Post("history/trends/runs/:trendRunId/recalculate")
  @Permissions(auditPermissions.trendRunRecalculate)
  recalculateTrendRun(@CurrentUser() user: RequestUser, @Param("trendRunId") trendRunId: string) { return this.historyTrends.recalculateTrendRun(user, trendRunId); }
  @Post("history/trends/runs/:trendRunId/archive")
  @Permissions(auditPermissions.trendRunArchive)
  archiveTrendRun(@CurrentUser() user: RequestUser, @Param("trendRunId") trendRunId: string, @Body() dto: Record<string, any>) { return this.historyTrends.archiveTrendRun(user, trendRunId, dto); }
  @Get("history/trends/runs/:trendRunId/input-snapshot")
  @Permissions(auditPermissions.trendView)
  trendInputSnapshot(@CurrentUser() user: RequestUser, @Param("trendRunId") trendRunId: string) { return this.historyTrends.trendRunDetail(user, trendRunId).then((data) => data.inputSnapshot); }
  @Get("history/trends/runs/:trendRunId/results")
  @Permissions(auditPermissions.trendView)
  trendResults(@CurrentUser() user: RequestUser, @Param("trendRunId") trendRunId: string) { return this.historyTrends.trendRunDetail(user, trendRunId).then((data) => data.results); }
  @Get("history/trends/runs/:trendRunId/explainability")
  @Permissions(auditPermissions.trendExplainabilityView)
  trendExplainability(@CurrentUser() user: RequestUser, @Param("trendRunId") trendRunId: string) { return this.historyTrends.trendRunDetail(user, trendRunId).then((data) => data.explainability); }
  @Get("history/trends/runs/:trendRunId/source-records")
  @Permissions(auditPermissions.trendSourceRecordsView)
  trendSourceRecords(@CurrentUser() user: RequestUser, @Param("trendRunId") trendRunId: string) { return this.historyTrends.trendRunDetail(user, trendRunId).then((data) => data.sourceRecords); }
  @Get("history/trends/runs/:trendRunId/actions-foundation")
  @Permissions(auditPermissions.continuousImprovementView)
  trendActionsFoundation(@CurrentUser() user: RequestUser, @Param("trendRunId") trendRunId: string) { return this.historyTrends.trendRunDetail(user, trendRunId).then((data) => data.actionsFoundation); }
  @Get("history/trends/runs/:trendRunId/history")
  @Permissions(auditPermissions.trendHistoryView)
  trendHistory(@CurrentUser() user: RequestUser, @Param("trendRunId") trendRunId: string) { return this.historyTrends.trendRunDetail(user, trendRunId).then((data) => data.history); }

  @Get("history/repeat-findings")
  @Permissions(auditPermissions.repeatFindingView)
  historyRepeatFindings(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.historyTrends.repeatFindings(user, query); }
  @Post("history/repeat-findings/detect")
  @Permissions(auditPermissions.repeatFindingReview)
  detectRepeatFindings(@CurrentUser() user: RequestUser, @Body() dto: Record<string, any>) { return this.historyTrends.detectRepeatFindings(user, dto); }
  @Get("findings/:findingId/repeat-analysis")
  @Permissions(auditPermissions.repeatFindingView)
  findingRepeatAnalysis(@CurrentUser() user: RequestUser, @Param("findingId") findingId: string) { return this.historyTrends.repeatAnalysis(user, findingId); }
  @Post("history/repeat-findings/:matchId/confirm")
  @Permissions(auditPermissions.repeatFindingConfirm)
  confirmRepeatFinding(@CurrentUser() user: RequestUser, @Param("matchId") matchId: string, @Body() dto: Record<string, any>) { return this.historyTrends.reviewRepeatFinding(user, matchId, "confirm", dto); }
  @Post("history/repeat-findings/:matchId/reject")
  @Permissions(auditPermissions.repeatFindingReject)
  rejectRepeatFinding(@CurrentUser() user: RequestUser, @Param("matchId") matchId: string, @Body() dto: Record<string, any>) { return this.historyTrends.reviewRepeatFinding(user, matchId, "reject", dto); }
  @Post("history/repeat-findings/:matchId/mark-recurring")
  @Permissions(auditPermissions.recurringIssueManage)
  markRepeatRecurring(@CurrentUser() user: RequestUser, @Param("matchId") matchId: string, @Body() dto: Record<string, any>) { return this.historyTrends.reviewRepeatFinding(user, matchId, "mark-recurring", dto); }
  @Post("history/repeat-findings/:matchId/mark-systemic")
  @Permissions(auditPermissions.recurringIssueManage)
  markRepeatSystemic(@CurrentUser() user: RequestUser, @Param("matchId") matchId: string, @Body() dto: Record<string, any>) { return this.historyTrends.reviewRepeatFinding(user, matchId, "mark-systemic", dto); }

  @Get("history/recurring-issues")
  @Permissions(auditPermissions.recurringIssueView)
  recurringIssues(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.historyTrends.recurringIssues(user, query); }
  @Get("history/recurring-issues/:clusterId")
  @Permissions(auditPermissions.recurringIssueView)
  recurringIssue(@CurrentUser() user: RequestUser, @Param("clusterId") clusterId: string) { return this.historyTrends.recurringIssue(user, clusterId); }
  @Post("history/recurring-issues/:clusterId/close")
  @Permissions(auditPermissions.recurringIssueManage)
  closeRecurringIssue(@CurrentUser() user: RequestUser, @Param("clusterId") clusterId: string, @Body() dto: Record<string, any>) { return this.historyTrends.transitionRecurringIssue(user, clusterId, "close", dto); }
  @Post("history/recurring-issues/:clusterId/reopen")
  @Permissions(auditPermissions.recurringIssueManage)
  reopenRecurringIssue(@CurrentUser() user: RequestUser, @Param("clusterId") clusterId: string, @Body() dto: Record<string, any>) { return this.historyTrends.transitionRecurringIssue(user, clusterId, "reopen", dto); }

  @Get("history/compliance-score-trends")
  @Permissions(auditPermissions.trendDashboardView)
  complianceScoreTrends(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.historyTrends.trendView(user, "Compliance Score Trend", query); }
  @Get("history/capa-effectiveness-trends")
  @Permissions(auditPermissions.trendDashboardView)
  capaEffectivenessTrends(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.historyTrends.trendView(user, "CAPA Effectiveness Trend", query); }
  @Get("history/evidence-gap-trends")
  @Permissions(auditPermissions.trendDashboardView)
  evidenceGapTrends(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.historyTrends.trendView(user, "Evidence Gap Trend", query); }
  @Get("history/review-cycle-trends")
  @Permissions(auditPermissions.trendDashboardView)
  reviewCycleTrends(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.historyTrends.trendView(user, "Review Approval Cycle Trend", query); }
  @Get("history/report-export-trends")
  @Permissions(auditPermissions.trendDashboardView)
  reportExportTrends(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.historyTrends.trendView(user, "Report Export Trend", query); }
  @Get("history/stale-trends")
  @Permissions(auditPermissions.trendView)
  staleTrends(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.historyTrends.trendRuns(user, { ...query, staleStatus: query.staleStatus ?? "Stale" }); }

  @Get("history/continuous-improvement")
  @Permissions(auditPermissions.continuousImprovementView)
  continuousImprovement(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.historyTrends.continuousImprovement(user, query); }
  @Post("history/continuous-improvement")
  @Permissions(auditPermissions.continuousImprovementCreate)
  createContinuousImprovement(@CurrentUser() user: RequestUser, @Body() dto: Record<string, any>) { return this.historyTrends.createOpportunity(user, dto); }
  @Get("history/continuous-improvement/:opportunityId")
  @Permissions(auditPermissions.continuousImprovementView)
  continuousImprovementDetail(@CurrentUser() user: RequestUser, @Param("opportunityId") opportunityId: string) { return this.historyTrends.opportunity(user, opportunityId); }
  @Patch("history/continuous-improvement/:opportunityId")
  @Permissions(auditPermissions.continuousImprovementEdit)
  updateContinuousImprovement(@CurrentUser() user: RequestUser, @Param("opportunityId") opportunityId: string, @Body() dto: Record<string, any>) { return this.historyTrends.updateOpportunity(user, opportunityId, dto); }
  @Post("history/continuous-improvement/:opportunityId/create-action-foundation")
  @Permissions(auditPermissions.continuousImprovementCreateActionFoundation)
  createImprovementActionFoundation(@CurrentUser() user: RequestUser, @Param("opportunityId") opportunityId: string, @Body() dto: Record<string, any>) { return this.historyTrends.createActionFoundation(user, opportunityId, dto); }
  @Post("history/continuous-improvement/:opportunityId/close")
  @Permissions(auditPermissions.continuousImprovementClose)
  closeContinuousImprovement(@CurrentUser() user: RequestUser, @Param("opportunityId") opportunityId: string, @Body() dto: Record<string, any>) { return this.historyTrends.closeOpportunity(user, opportunityId, dto); }
  @Post("history/continuous-improvement/:opportunityId/archive")
  @Permissions(auditPermissions.continuousImprovementEdit)
  archiveContinuousImprovement(@CurrentUser() user: RequestUser, @Param("opportunityId") opportunityId: string, @Body() dto: Record<string, any>) { return this.historyTrends.archiveOpportunity(user, opportunityId, dto); }

  @Get("history/settings")
  @Permissions(auditPermissions.trendSettingsView)
  trendSettings(@CurrentUser() user: RequestUser, @Query("siteId") siteId?: string) { return this.historyTrends.settings(user, siteId); }
  @Patch("history/settings")
  @Permissions(auditPermissions.trendSettingsEdit)
  updateTrendSettings(@CurrentUser() user: RequestUser, @Body() dto: Record<string, any>) { return this.historyTrends.updateSettings(user, dto); }

  @Get("programs/:programId/history") @Permissions(auditPermissions.historyView) programHistoryTrend(@CurrentUser() user: RequestUser, @Param("programId") id: string, @Query() query: Record<string, any>) { return this.historyTrends.sourceHistory(user, "program", id, query); }
  @Get("programs/:programId/trends") @Permissions(auditPermissions.trendView) programTrends(@CurrentUser() user: RequestUser, @Param("programId") id: string, @Query() query: Record<string, any>) { return this.historyTrends.sourceTrends(user, "program", id, query); }
  @Get("plans/:planId/history") @Permissions(auditPermissions.historyView) planHistoryTrend(@CurrentUser() user: RequestUser, @Param("planId") id: string, @Query() query: Record<string, any>) { return this.historyTrends.sourceHistory(user, "plan", id, query); }
  @Get("execution/:executionId/history") @Permissions(auditPermissions.historyView) executionHistoryTrend(@CurrentUser() user: RequestUser, @Param("executionId") id: string, @Query() query: Record<string, any>) { return this.historyTrends.sourceHistory(user, "execution", id, query); }
  @Get("findings/:findingId/history") @Permissions(auditPermissions.historyView) findingHistoryTrend(@CurrentUser() user: RequestUser, @Param("findingId") id: string, @Query() query: Record<string, any>) { return this.historyTrends.sourceHistory(user, "finding", id, query); }
  @Get("capa/:capaId/history") @Permissions(auditPermissions.historyView) capaHistoryTrend(@CurrentUser() user: RequestUser, @Param("capaId") id: string, @Query() query: Record<string, any>) { return this.historyTrends.sourceHistory(user, "capa", id, query); }
  @Get("evidence/:evidenceId/history") @Permissions(auditPermissions.historyView) evidenceHistoryTrend(@CurrentUser() user: RequestUser, @Param("evidenceId") id: string, @Query() query: Record<string, any>) { return this.historyTrends.sourceHistory(user, "evidence", id, query); }
  @Get("scoring/runs/:runId/history") @Permissions(auditPermissions.historyView) scoreHistoryTrend(@CurrentUser() user: RequestUser, @Param("runId") id: string, @Query() query: Record<string, any>) { return this.historyTrends.sourceHistory(user, "scoring", id, query); }
  @Get("standards-mapping/:mappingId/history") @Permissions(auditPermissions.historyView) standardsMappingHistoryTrend(@CurrentUser() user: RequestUser, @Param("mappingId") id: string, @Query() query: Record<string, any>) { return this.historyTrends.sourceHistory(user, "standards-mapping", id, query); }
  @Get("reports/:reportId/history") @Permissions(auditPermissions.historyView) reportHistoryTrend(@CurrentUser() user: RequestUser, @Param("reportId") id: string, @Query() query: Record<string, any>) { return this.historyTrends.sourceHistory(user, "reports", id, query); }
  @Get("sites/:siteId/history") @Permissions(auditPermissions.historyView) siteHistoryTrend(@CurrentUser() user: RequestUser, @Param("siteId") id: string, @Query() query: Record<string, any>) { return this.historyTrends.scopedHistory(user, "site", id, query); }
  @Get("sites/:siteId/trends") @Permissions(auditPermissions.trendView) siteTrends(@CurrentUser() user: RequestUser, @Param("siteId") id: string, @Query() query: Record<string, any>) { return this.historyTrends.scopedTrends(user, "site", id, query); }
  @Get("units/:unitId/history") @Permissions(auditPermissions.historyView) unitHistoryTrend(@CurrentUser() user: RequestUser, @Param("unitId") id: string, @Query() query: Record<string, any>) { return this.historyTrends.scopedHistory(user, "unit", id, query); }
  @Get("units/:unitId/trends") @Permissions(auditPermissions.trendView) unitTrends(@CurrentUser() user: RequestUser, @Param("unitId") id: string, @Query() query: Record<string, any>) { return this.historyTrends.scopedTrends(user, "unit", id, query); }
  @Get("areas/:areaId/history") @Permissions(auditPermissions.historyView) areaHistoryTrend(@CurrentUser() user: RequestUser, @Param("areaId") id: string, @Query() query: Record<string, any>) { return this.historyTrends.scopedHistory(user, "area", id, query); }
  @Get("areas/:areaId/trends") @Permissions(auditPermissions.trendView) areaTrends(@CurrentUser() user: RequestUser, @Param("areaId") id: string, @Query() query: Record<string, any>) { return this.historyTrends.scopedTrends(user, "area", id, query); }

  @Get("lookups/trend-run-types") @Permissions(auditPermissions.trendView) trendRunTypes() { return this.historyTrends.lookups().trendRunTypes; }
  @Get("lookups/trend-statuses") @Permissions(auditPermissions.trendView) trendStatuses() { return this.historyTrends.lookups().trendStatuses; }
  @Get("lookups/trend-result-categories") @Permissions(auditPermissions.trendView) trendResultCategories() { return this.historyTrends.lookups().trendResultCategories; }
  @Get("lookups/trend-directions") @Permissions(auditPermissions.trendView) trendDirections() { return this.historyTrends.lookups().trendDirections; }
  @Get("lookups/trend-confidence-levels") @Permissions(auditPermissions.trendView) trendConfidenceLevels() { return this.historyTrends.lookups().trendConfidenceLevels; }
  @Get("lookups/repeat-statuses") @Permissions(auditPermissions.repeatFindingView) repeatStatuses() { return this.historyTrends.lookups().repeatStatuses; }
  @Get("lookups/recurring-issue-statuses") @Permissions(auditPermissions.recurringIssueView) recurringIssueStatuses() { return this.historyTrends.lookups().recurringIssueStatuses; }
  @Get("lookups/improvement-opportunity-types") @Permissions(auditPermissions.continuousImprovementView) improvementOpportunityTypes() { return this.historyTrends.lookups().improvementOpportunityTypes; }
  @Get("lookups/improvement-opportunity-statuses") @Permissions(auditPermissions.continuousImprovementView) improvementOpportunityStatuses() { return this.historyTrends.lookups().improvementOpportunityStatuses; }

  @Get("reports/dashboard")
  @Permissions(auditPermissions.reportDashboardView)
  reportDashboard(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.reports.dashboard(user, query); }
  @Get("reports/dashboard/summary")
  @Permissions(auditPermissions.reportDashboardView)
  reportDashboardSummary(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.reports.dashboardSummary(user, query); }
  @Get("reports/dashboard/by-site")
  @Permissions(auditPermissions.reportDashboardView)
  reportDashboardBySite(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.reports.dashboard(user, query).then((data) => data.bySite); }
  @Get("reports/dashboard/by-type")
  @Permissions(auditPermissions.reportDashboardView)
  reportDashboardByType(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.reports.dashboard(user, query).then((data) => data.byType); }
  @Get("reports/dashboard/stale")
  @Permissions(auditPermissions.reportDashboardView)
  reportDashboardStale(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.reports.dashboard(user, query).then((data) => data.staleReports); }
  @Get("reports/dashboard/failed-jobs")
  @Permissions(auditPermissions.reportDashboardView)
  reportDashboardFailedJobs(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.reports.dashboard(user, query).then((data) => data.failedJobs); }
  @Get("reports/dashboard/recent")
  @Permissions(auditPermissions.reportDashboardView)
  reportDashboardRecent(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.reports.dashboard(user, query).then((data) => data.recentReports); }
  @Get("reports/dashboard/download-activity")
  @Permissions(auditPermissions.reportDashboardView)
  reportDashboardDownloadActivity(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.reports.dashboard(user, query).then((data) => data.downloadActivity); }

  @Get("reports/register")
  @Permissions(auditPermissions.reportRegisterView)
  reportRegister(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.reports.register(user, query); }
  @Get("reports/summary")
  @Permissions(auditPermissions.reportRegisterView)
  reportSummary(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.reports.register(user, query).then((data) => data.summary); }
  @Post("reports")
  @Permissions(auditPermissions.reportCreate)
  createReport(@CurrentUser() user: RequestUser, @Body() dto: Record<string, any>) { return this.reports.create(user, dto); }
  @Post("reports/generate")
  @Permissions(auditPermissions.reportGenerate)
  generateReport(@CurrentUser() user: RequestUser, @Body() dto: Record<string, any>) { return this.reports.generate(user, dto); }
  @Post("reports/generate-preview")
  @Permissions(auditPermissions.reportPreview)
  generateReportPreview(@CurrentUser() user: RequestUser, @Body() dto: Record<string, any>) { return this.reports.preview(user, dto); }
  @Get("reports/jobs")
  @Permissions(auditPermissions.reportGenerate)
  reportJobs(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.reports.jobs(user, query); }
  @Get("reports/jobs/:jobId")
  @Permissions(auditPermissions.reportGenerate)
  reportJob(@CurrentUser() user: RequestUser, @Param("jobId") jobId: string) { return this.reports.job(user, jobId); }
  @Post("reports/jobs/:jobId/cancel")
  @Permissions(auditPermissions.reportGenerate)
  cancelReportJob(@CurrentUser() user: RequestUser, @Param("jobId") jobId: string, @Body() dto: Record<string, any>) { return this.reports.jobTransition(user, jobId, "cancel", dto); }
  @Post("reports/jobs/:jobId/retry")
  @Permissions(auditPermissions.reportGenerate)
  retryReportJob(@CurrentUser() user: RequestUser, @Param("jobId") jobId: string, @Body() dto: Record<string, any>) { return this.reports.jobTransition(user, jobId, "retry", dto); }

  @Get("reports/templates")
  @Permissions(auditPermissions.reportTemplateView)
  reportTemplates(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.reports.templates(user, query); }
  @Post("reports/templates")
  @Permissions(auditPermissions.reportTemplateCreate)
  createReportTemplate(@CurrentUser() user: RequestUser, @Body() dto: Record<string, any>) { return this.reports.saveTemplate(user, dto); }
  @Get("reports/templates/:templateId")
  @Permissions(auditPermissions.reportTemplateView)
  reportTemplate(@CurrentUser() user: RequestUser, @Param("templateId") templateId: string) { return this.reports.template(user, templateId); }
  @Patch("reports/templates/:templateId")
  @Permissions(auditPermissions.reportTemplateEdit)
  updateReportTemplate(@CurrentUser() user: RequestUser, @Param("templateId") templateId: string, @Body() dto: Record<string, any>) { return this.reports.saveTemplate(user, dto, templateId); }
  @Post("reports/templates/:templateId/approve")
  @Permissions(auditPermissions.reportTemplateApprove)
  approveReportTemplate(@CurrentUser() user: RequestUser, @Param("templateId") templateId: string, @Body() dto: Record<string, any>) { return this.reports.templateTransition(user, templateId, "approve", dto); }
  @Post("reports/templates/:templateId/create-version")
  @Permissions(auditPermissions.reportTemplateEdit)
  createReportTemplateVersion(@CurrentUser() user: RequestUser, @Param("templateId") templateId: string, @Body() dto: Record<string, any>) { return this.reports.templateTransition(user, templateId, "create-version", dto); }
  @Post("reports/templates/:templateId/archive")
  @Permissions(auditPermissions.reportTemplateArchive)
  archiveReportTemplate(@CurrentUser() user: RequestUser, @Param("templateId") templateId: string, @Body() dto: Record<string, any>) { return this.reports.templateTransition(user, templateId, "archive", dto); }

  @Get("reports/packages")
  @Permissions(auditPermissions.reportPackageView)
  reportPackages(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.reports.packages(user, query); }
  @Post("reports/packages")
  @Permissions(auditPermissions.reportPackagePrepare)
  createReportPackage(@CurrentUser() user: RequestUser, @Body() dto: Record<string, any>) { return this.reports.createPackage(user, dto); }
  @Get("reports/packages/:packageId")
  @Permissions(auditPermissions.reportPackageView)
  reportPackage(@CurrentUser() user: RequestUser, @Param("packageId") packageId: string) { return this.reports.packageDetail(user, packageId); }
  @Post("reports/packages/:packageId/prepare")
  @Permissions(auditPermissions.reportPackagePrepare)
  prepareReportPackage(@CurrentUser() user: RequestUser, @Param("packageId") packageId: string, @Body() dto: Record<string, any>) { return this.reports.packageTransition(user, packageId, "prepare", dto); }
  @Post("reports/packages/:packageId/export")
  @Permissions(auditPermissions.reportPackageExport)
  exportReportPackage(@CurrentUser() user: RequestUser, @Param("packageId") packageId: string, @Body() dto: Record<string, any>) { return this.reports.packageTransition(user, packageId, "export", dto); }
  @Post("reports/packages/:packageId/add-report")
  @Permissions(auditPermissions.reportPackagePrepare)
  addReportToPackage(@CurrentUser() user: RequestUser, @Param("packageId") packageId: string, @Body() dto: Record<string, any>) { return this.reports.addPackageItem(user, packageId, { ...dto, itemType: "Report" }); }
  @Post("reports/packages/:packageId/add-evidence")
  @Permissions(auditPermissions.reportPackagePrepare)
  addEvidenceToPackage(@CurrentUser() user: RequestUser, @Param("packageId") packageId: string, @Body() dto: Record<string, any>) { return this.reports.addPackageItem(user, packageId, { ...dto, itemType: "Evidence" }); }
  @Delete("reports/packages/:packageId/items/:itemId")
  @Permissions(auditPermissions.reportPackagePrepare)
  removeReportPackageItem(@CurrentUser() user: RequestUser, @Param("packageId") packageId: string, @Param("itemId") itemId: string) { return this.reports.removePackageItem(user, packageId, itemId); }

  @Get("reports/downloads")
  @Permissions(auditPermissions.reportDownloadLogView)
  reportDownloads(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.reports.downloads(user, query); }
  @Get("reports/access-log")
  @Permissions(auditPermissions.reportAccessLogView)
  reportAccessLog(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.reports.accessLog(user, query); }
  @Get("reports/history")
  @Permissions(auditPermissions.reportHistoryView)
  reportHistory(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.reports.historyEvents(user, query); }
  @Get("reports/settings")
  @Permissions(auditPermissions.reportSettingsView)
  reportSettings(@CurrentUser() user: RequestUser, @Query("siteId") siteId?: string) { return this.reports.settings(user, siteId ?? null); }
  @Patch("reports/settings")
  @Permissions(auditPermissions.reportSettingsEdit)
  updateReportSettings(@CurrentUser() user: RequestUser, @Body() dto: Record<string, any>) { return this.reports.updateSettings(user, dto); }
  @Get("reports/context")
  @Permissions(auditPermissions.reportView)
  reportContext(@CurrentUser() user: RequestUser) { return this.reports.context(user); }

  @Get("reports/draft")
  @Permissions(auditPermissions.reportRegisterView)
  draftReports(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.reports.register(user, { ...query, view: "draft" }); }
  @Get("reports/generated")
  @Permissions(auditPermissions.reportRegisterView)
  generatedReports(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.reports.register(user, { ...query, view: "generated" }); }
  @Get("reports/pending-approval")
  @Permissions(auditPermissions.reportRegisterView)
  pendingApprovalReports(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.reports.register(user, { ...query, view: "pending-approval" }); }
  @Get("reports/approved")
  @Permissions(auditPermissions.reportRegisterView)
  approvedReports(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.reports.register(user, { ...query, view: "approved" }); }
  @Get("reports/locked")
  @Permissions(auditPermissions.reportRegisterView)
  lockedReports(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.reports.register(user, { ...query, view: "locked" }); }
  @Get("reports/stale")
  @Permissions(auditPermissions.reportRegisterView)
  staleReports(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.reports.register(user, { ...query, view: "stale" }); }
  @Get("reports/failed")
  @Permissions(auditPermissions.reportRegisterView)
  failedReports(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.reports.register(user, { ...query, view: "failed" }); }
  @Get("reports/exported")
  @Permissions(auditPermissions.reportRegisterView)
  exportedReports(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.reports.register(user, { ...query, view: "exported" }); }
  @Get("reports/archived")
  @Permissions(auditPermissions.reportRegisterView)
  archivedReports(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.reports.register(user, { ...query, view: "archived", includeArchived: true }); }

  @Get("reports/:reportId")
  @Permissions(auditPermissions.reportView)
  reportDetail(@CurrentUser() user: RequestUser, @Param("reportId") reportId: string) { return this.reports.detail(user, reportId); }
  @Patch("reports/:reportId")
  @Permissions(auditPermissions.reportCreate)
  updateReport(@CurrentUser() user: RequestUser, @Param("reportId") reportId: string, @Body() dto: Record<string, any>) { return this.reports.update(user, reportId, dto); }
  @Post("reports/:reportId/generate")
  @Permissions(auditPermissions.reportGenerate)
  generateExistingReport(@CurrentUser() user: RequestUser, @Param("reportId") reportId: string, @Body() dto: Record<string, any>) { return this.reports.transition(user, reportId, "generate", dto); }
  @Post("reports/:reportId/regenerate")
  @Permissions(auditPermissions.reportRegenerate)
  regenerateReport(@CurrentUser() user: RequestUser, @Param("reportId") reportId: string, @Body() dto: Record<string, any>) { return this.reports.transition(user, reportId, "regenerate", dto); }
  @Post("reports/:reportId/submit-approval")
  @Permissions(auditPermissions.reportApprovalSubmit)
  submitReportApproval(@CurrentUser() user: RequestUser, @Param("reportId") reportId: string, @Body() dto: Record<string, any>) { return this.reports.transition(user, reportId, "submit-approval", dto); }
  @Post("reports/:reportId/lock")
  @Permissions(auditPermissions.reportLock)
  lockReport(@CurrentUser() user: RequestUser, @Param("reportId") reportId: string, @Body() dto: Record<string, any>) { return this.reports.transition(user, reportId, "lock", dto); }
  @Post("reports/:reportId/unlock")
  @Permissions(auditPermissions.reportUnlock)
  unlockReport(@CurrentUser() user: RequestUser, @Param("reportId") reportId: string, @Body() dto: Record<string, any>) { return this.reports.transition(user, reportId, "unlock", dto); }
  @Post("reports/:reportId/mark-historical")
  @Permissions(auditPermissions.reportMarkHistorical)
  markReportHistorical(@CurrentUser() user: RequestUser, @Param("reportId") reportId: string, @Body() dto: Record<string, any>) { return this.reports.transition(user, reportId, "mark-historical", dto); }
  @Post("reports/:reportId/archive")
  @Permissions(auditPermissions.reportArchive)
  archiveReport(@CurrentUser() user: RequestUser, @Param("reportId") reportId: string, @Body() dto: Record<string, any>) { return this.reports.transition(user, reportId, "archive", dto); }
  @Post("reports/:reportId/run-validation")
  @Permissions(auditPermissions.reportValidationRun)
  runReportValidation(@CurrentUser() user: RequestUser, @Param("reportId") reportId: string, @Body() dto: Record<string, any>) { return this.reports.transition(user, reportId, "run-validation", dto); }
  @Post("reports/:reportId/mark-stale")
  @Permissions(auditPermissions.reportCreate)
  markReportStale(@CurrentUser() user: RequestUser, @Param("reportId") reportId: string, @Body() dto: Record<string, any>) { return this.reports.transition(user, reportId, "mark-stale", dto); }
  @Get("reports/:reportId/preview")
  @Permissions(auditPermissions.reportPreview)
  reportPreview(@CurrentUser() user: RequestUser, @Param("reportId") reportId: string) { return this.reports.logPreview(user, reportId); }
  @Get("reports/:reportId/download")
  @Permissions(auditPermissions.reportDownload)
  downloadReport(@CurrentUser() user: RequestUser, @Param("reportId") reportId: string) { return this.reports.download(user, reportId); }
  @Post("reports/:reportId/export")
  @Permissions(auditPermissions.reportExport)
  exportReport(@CurrentUser() user: RequestUser, @Param("reportId") reportId: string, @Body() dto: Record<string, any>) { return this.reports.transition(user, reportId, "export", dto); }
  @Get("reports/:reportId/files/:fileId/download")
  @Permissions(auditPermissions.reportDownload)
  downloadReportFile(@CurrentUser() user: RequestUser, @Param("reportId") reportId: string, @Param("fileId") fileId: string) { return this.reports.download(user, reportId, fileId); }
  @Get("reports/:reportId/source") @Permissions(auditPermissions.reportView) reportSource(@CurrentUser() user: RequestUser, @Param("reportId") reportId: string) { return this.reports.section(user, reportId, "source"); }
  @Get("reports/:reportId/snapshot") @Permissions(auditPermissions.reportView) reportSnapshot(@CurrentUser() user: RequestUser, @Param("reportId") reportId: string) { return this.reports.section(user, reportId, "snapshot"); }
  @Get("reports/:reportId/sections") @Permissions(auditPermissions.reportView) reportSections(@CurrentUser() user: RequestUser, @Param("reportId") reportId: string) { return this.reports.section(user, reportId, "sections"); }
  @Get("reports/:reportId/evidence") @Permissions(auditPermissions.reportView) reportEvidence(@CurrentUser() user: RequestUser, @Param("reportId") reportId: string) { return this.reports.section(user, reportId, "evidence"); }
  @Get("reports/:reportId/findings") @Permissions(auditPermissions.reportView) reportFindings(@CurrentUser() user: RequestUser, @Param("reportId") reportId: string) { return this.reports.section(user, reportId, "findings"); }
  @Get("reports/:reportId/capa") @Permissions(auditPermissions.reportView) reportCapa(@CurrentUser() user: RequestUser, @Param("reportId") reportId: string) { return this.reports.section(user, reportId, "capa"); }
  @Get("reports/:reportId/scoring") @Permissions(auditPermissions.reportView) reportScoring(@CurrentUser() user: RequestUser, @Param("reportId") reportId: string) { return this.reports.section(user, reportId, "scoring"); }
  @Get("reports/:reportId/standards") @Permissions(auditPermissions.reportView) reportStandards(@CurrentUser() user: RequestUser, @Param("reportId") reportId: string) { return this.reports.section(user, reportId, "standards"); }
  @Get("reports/:reportId/approval") @Permissions(auditPermissions.reportApprovalView) reportApproval(@CurrentUser() user: RequestUser, @Param("reportId") reportId: string) { return this.reports.section(user, reportId, "approval"); }
  @Get("reports/:reportId/files") @Permissions(auditPermissions.reportView) reportFiles(@CurrentUser() user: RequestUser, @Param("reportId") reportId: string) { return this.reports.section(user, reportId, "files"); }
  @Get("reports/:reportId/versions") @Permissions(auditPermissions.reportView) reportVersions(@CurrentUser() user: RequestUser, @Param("reportId") reportId: string) { return this.reports.section(user, reportId, "versions"); }
  @Get("reports/:reportId/access") @Permissions(auditPermissions.reportAccessLogView) reportAccess(@CurrentUser() user: RequestUser, @Param("reportId") reportId: string) { return this.reports.section(user, reportId, "access"); }
  @Get("reports/:reportId/history") @Permissions(auditPermissions.reportHistoryView) reportHistorySection(@CurrentUser() user: RequestUser, @Param("reportId") reportId: string) { return this.reports.section(user, reportId, "history"); }

  @Get("programs/:programId/reports") @Permissions(auditPermissions.reportView) programReports(@CurrentUser() user: RequestUser, @Param("programId") id: string, @Query() query: Record<string, any>) { return this.reports.sourceReports(user, "program", id, query); }
  @Post("programs/:programId/reports/generate") @Permissions(auditPermissions.reportGenerate) generateProgramReport(@CurrentUser() user: RequestUser, @Param("programId") id: string, @Body() dto: Record<string, any>) { return this.reports.sourceGenerate(user, "program", id, dto); }
  @Get("plans/:planId/reports") @Permissions(auditPermissions.reportView) planReports(@CurrentUser() user: RequestUser, @Param("planId") id: string, @Query() query: Record<string, any>) { return this.reports.sourceReports(user, "plan", id, query); }
  @Post("plans/:planId/reports/generate") @Permissions(auditPermissions.reportGenerate) generatePlanReport(@CurrentUser() user: RequestUser, @Param("planId") id: string, @Body() dto: Record<string, any>) { return this.reports.sourceGenerate(user, "plan", id, dto); }
  @Get("execution/:executionId/reports") @Permissions(auditPermissions.reportView) executionReports(@CurrentUser() user: RequestUser, @Param("executionId") id: string, @Query() query: Record<string, any>) { return this.reports.sourceReports(user, "execution", id, query); }
  @Post("execution/:executionId/reports/generate") @Permissions(auditPermissions.reportGenerate) generateExecutionReport(@CurrentUser() user: RequestUser, @Param("executionId") id: string, @Body() dto: Record<string, any>) { return this.reports.sourceGenerate(user, "execution", id, dto); }
  @Get("findings/:findingId/reports") @Permissions(auditPermissions.reportView) findingReports(@CurrentUser() user: RequestUser, @Param("findingId") id: string, @Query() query: Record<string, any>) { return this.reports.sourceReports(user, "finding", id, query); }
  @Get("capa/:capaId/reports") @Permissions(auditPermissions.reportView) capaReports(@CurrentUser() user: RequestUser, @Param("capaId") id: string, @Query() query: Record<string, any>) { return this.reports.sourceReports(user, "capa", id, query); }
  @Get("evidence/packages/:packageId/reports") @Permissions(auditPermissions.reportView) evidencePackageReports(@CurrentUser() user: RequestUser, @Param("packageId") id: string, @Query() query: Record<string, any>) { return this.reports.sourceReports(user, "evidence", id, query); }
  @Get("scoring/runs/:runId/reports") @Permissions(auditPermissions.reportView) scoreRunReports(@CurrentUser() user: RequestUser, @Param("runId") id: string, @Query() query: Record<string, any>) { return this.reports.sourceReports(user, "scoring", id, query); }
  @Get("standards-mapping/:mappingId/reports") @Permissions(auditPermissions.reportView) standardsMappingReports(@CurrentUser() user: RequestUser, @Param("mappingId") id: string, @Query() query: Record<string, any>) { return this.reports.sourceReports(user, "standards-mapping", id, query); }
  @Get("review-approval/packages/:approvalId/reports") @Permissions(auditPermissions.reportView) approvalReports(@CurrentUser() user: RequestUser, @Param("approvalId") id: string, @Query() query: Record<string, any>) { return this.reports.sourceReports(user, "approval", id, query); }
  @Get("sites/:siteId/reports") @Permissions(auditPermissions.reportView) siteReports(@CurrentUser() user: RequestUser, @Param("siteId") siteId: string, @Query() query: Record<string, any>) { return this.reports.register(user, { ...query, siteId }); }
  @Get("units/:unitId/reports") @Permissions(auditPermissions.reportView) unitReports(@CurrentUser() user: RequestUser, @Param("unitId") unitId: string, @Query() query: Record<string, any>) { return this.reports.register(user, { ...query, unitId }); }
  @Get("areas/:areaId/reports") @Permissions(auditPermissions.reportView) areaReports(@CurrentUser() user: RequestUser, @Param("areaId") areaId: string, @Query() query: Record<string, any>) { return this.reports.register(user, { ...query, areaId }); }

  @Get("lookups/report-types") @Permissions(auditPermissions.reportView) reportTypes() { return this.reports.lookups().reportTypes; }
  @Get("lookups/report-statuses") @Permissions(auditPermissions.reportView) reportStatuses() { return this.reports.lookups().reportStatuses; }
  @Get("lookups/report-readiness-statuses") @Permissions(auditPermissions.reportView) reportReadinessStatuses() { return this.reports.lookups().reportReadinessStatuses; }
  @Get("lookups/report-stale-statuses") @Permissions(auditPermissions.reportView) reportStaleStatuses() { return this.reports.lookups().reportStaleStatuses; }
  @Get("lookups/report-formats") @Permissions(auditPermissions.reportView) reportFormats() { return this.reports.lookups().reportFormats; }
  @Get("lookups/report-template-statuses") @Permissions(auditPermissions.reportTemplateView) reportTemplateStatuses() { return this.reports.lookups().reportTemplateStatuses; }
  @Get("lookups/report-package-types") @Permissions(auditPermissions.reportPackageView) reportPackageTypes() { return this.reports.lookups().reportPackageTypes; }
  @Get("lookups/report-package-statuses") @Permissions(auditPermissions.reportPackageView) reportPackageStatuses() { return this.reports.lookups().reportPackageStatuses; }
  @Get("lookups/report-intended-audiences") @Permissions(auditPermissions.reportView) reportIntendedAudiences() { return this.reports.lookups().reportIntendedAudiences; }

  @Get("review-approval/dashboard")
  @Permissions(auditPermissions.reviewDashboardView)
  reviewDashboard(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.reviewApproval.dashboard(user, query); }
  @Get("review-approval/dashboard/summary")
  @Permissions(auditPermissions.reviewDashboardView)
  reviewDashboardSummary(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.reviewApproval.dashboardSummary(user, query); }
  @Get("review-approval/inbox")
  @Permissions(auditPermissions.reviewInboxView)
  reviewInbox(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.reviewApproval.inbox(user, query); }
  @Get("review-approval/my-submissions")
  @Permissions(auditPermissions.reviewSubmissionView)
  reviewSubmissions(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.reviewApproval.submissions(user, query); }
  @Get("review-approval/pending")
  @Permissions(auditPermissions.reviewView)
  reviewPending(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.reviewApproval.view(user, "pending", query); }
  @Get("review-approval/overdue")
  @Permissions(auditPermissions.reviewView)
  reviewOverdue(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.reviewApproval.view(user, "overdue", query); }
  @Get("review-approval/returned")
  @Permissions(auditPermissions.reviewView)
  reviewReturned(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.reviewApproval.view(user, "returned", query); }
  @Get("review-approval/rejected")
  @Permissions(auditPermissions.reviewView)
  reviewRejected(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.reviewApproval.view(user, "rejected", query); }
  @Get("review-approval/approved")
  @Permissions(auditPermissions.reviewView)
  reviewApproved(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.reviewApproval.view(user, "approved", query); }
  @Get("review-approval/approved-with-conditions")
  @Permissions(auditPermissions.reviewView)
  reviewApprovedWithConditions(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.reviewApproval.view(user, "approved-with-conditions", query); }
  @Get("review-approval/completed")
  @Permissions(auditPermissions.reviewView)
  reviewCompleted(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.reviewApproval.view(user, "completed", query); }
  @Get("review-approval/escalated")
  @Permissions(auditPermissions.reviewView)
  reviewEscalated(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.reviewApproval.view(user, "escalated", query); }
  @Get("review-approval/stale")
  @Permissions(auditPermissions.reviewView)
  reviewStale(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.reviewApproval.view(user, "stale", query); }
  @Get("review-approval/validation-failures")
  @Permissions(auditPermissions.reviewValidationView)
  reviewValidationFailures(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.reviewApproval.view(user, "validation-failures", query); }
  @Get("review-approval/e-signatures")
  @Permissions(auditPermissions.reviewEsign)
  reviewEsignatures(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.reviewApproval.view(user, "e-signatures", query); }

  @Get("review-approval/packages")
  @Permissions(auditPermissions.reviewPackageView)
  approvalPackages(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.reviewApproval.packages(user, query); }
  @Post("review-approval/packages")
  @Permissions(auditPermissions.reviewPackageCreate)
  createApprovalPackage(@CurrentUser() user: RequestUser, @Body() dto: Record<string, any>) { return this.reviewApproval.createPackage(user, dto); }
  @Get("review-approval/packages/:approvalId")
  @Permissions(auditPermissions.reviewPackageView)
  approvalPackage(@CurrentUser() user: RequestUser, @Param("approvalId") approvalId: string) { return this.reviewApproval.detail(user, approvalId); }
  @Post("review-approval/packages/:approvalId/submit")
  @Permissions(auditPermissions.reviewPackageSubmit)
  submitApprovalPackage(@CurrentUser() user: RequestUser, @Param("approvalId") approvalId: string, @Body() dto: Record<string, any>) { return this.reviewApproval.transition(user, approvalId, "submit", dto); }
  @Post("review-approval/packages/:approvalId/cancel")
  @Permissions(auditPermissions.reviewPackageCancel)
  cancelApprovalPackage(@CurrentUser() user: RequestUser, @Param("approvalId") approvalId: string, @Body() dto: Record<string, any>) { return this.reviewApproval.transition(user, approvalId, "cancel", dto); }
  @Post("review-approval/packages/:approvalId/resubmit")
  @Permissions(auditPermissions.reviewPackageResubmit)
  resubmitApprovalPackage(@CurrentUser() user: RequestUser, @Param("approvalId") approvalId: string, @Body() dto: Record<string, any>) { return this.reviewApproval.transition(user, approvalId, "resubmit", dto); }
  @Post("review-approval/packages/:approvalId/refresh-snapshot")
  @Permissions(auditPermissions.reviewPackageRefreshSnapshot)
  refreshApprovalSnapshot(@CurrentUser() user: RequestUser, @Param("approvalId") approvalId: string, @Body() dto: Record<string, any>) { return this.reviewApproval.transition(user, approvalId, "refresh-snapshot", dto); }
  @Post("review-approval/packages/:approvalId/run-validation")
  @Permissions(auditPermissions.reviewValidationRun)
  runApprovalValidation(@CurrentUser() user: RequestUser, @Param("approvalId") approvalId: string, @Body() dto: Record<string, any>) { return this.reviewApproval.transition(user, approvalId, "run-validation", dto); }
  @Post("review-approval/packages/:approvalId/mark-stale")
  @Permissions(auditPermissions.reviewPackageRefreshSnapshot)
  markApprovalStale(@CurrentUser() user: RequestUser, @Param("approvalId") approvalId: string, @Body() dto: Record<string, any>) { return this.reviewApproval.transition(user, approvalId, "mark-stale", dto); }
  @Post("review-approval/packages/:approvalId/archive")
  @Permissions(auditPermissions.reviewPackageCancel)
  archiveApprovalPackage(@CurrentUser() user: RequestUser, @Param("approvalId") approvalId: string, @Body() dto: Record<string, any>) { return this.reviewApproval.transition(user, approvalId, "archive", dto); }

  @Post("review-approval/packages/:approvalId/approve")
  @Permissions(auditPermissions.reviewApprove)
  approvePackage(@CurrentUser() user: RequestUser, @Param("approvalId") approvalId: string, @Body() dto: Record<string, any>) { return this.reviewApproval.transition(user, approvalId, "approve", dto); }
  @Post("review-approval/packages/:approvalId/approve-with-conditions")
  @Permissions(auditPermissions.reviewApproveWithConditions)
  approvePackageWithConditions(@CurrentUser() user: RequestUser, @Param("approvalId") approvalId: string, @Body() dto: Record<string, any>) { return this.reviewApproval.transition(user, approvalId, "approve-with-conditions", dto); }
  @Post("review-approval/packages/:approvalId/reject")
  @Permissions(auditPermissions.reviewReject)
  rejectPackage(@CurrentUser() user: RequestUser, @Param("approvalId") approvalId: string, @Body() dto: Record<string, any>) { return this.reviewApproval.transition(user, approvalId, "reject", dto); }
  @Post("review-approval/packages/:approvalId/return")
  @Permissions(auditPermissions.reviewReturn)
  returnPackage(@CurrentUser() user: RequestUser, @Param("approvalId") approvalId: string, @Body() dto: Record<string, any>) { return this.reviewApproval.transition(user, approvalId, "return", dto); }
  @Post("review-approval/packages/:approvalId/request-info")
  @Permissions(auditPermissions.reviewRequestInfo)
  requestPackageInfo(@CurrentUser() user: RequestUser, @Param("approvalId") approvalId: string, @Body() dto: Record<string, any>) { return this.reviewApproval.transition(user, approvalId, "request-info", dto); }
  @Post("review-approval/packages/:approvalId/delegate")
  @Permissions(auditPermissions.reviewDelegate)
  delegatePackage(@CurrentUser() user: RequestUser, @Param("approvalId") approvalId: string, @Body() dto: Record<string, any>) { return this.reviewApproval.transition(user, approvalId, "delegate", dto); }
  @Post("review-approval/packages/:approvalId/reassign")
  @Permissions(auditPermissions.reviewReassign)
  reassignPackage(@CurrentUser() user: RequestUser, @Param("approvalId") approvalId: string, @Body() dto: Record<string, any>) { return this.reviewApproval.transition(user, approvalId, "reassign", dto); }
  @Post("review-approval/packages/:approvalId/escalate")
  @Permissions(auditPermissions.reviewEscalate)
  escalatePackage(@CurrentUser() user: RequestUser, @Param("approvalId") approvalId: string, @Body() dto: Record<string, any>) { return this.reviewApproval.transition(user, approvalId, "escalate", dto); }
  @Post("review-approval/packages/:approvalId/e-sign")
  @Permissions(auditPermissions.reviewEsign)
  esignPackage(@CurrentUser() user: RequestUser, @Param("approvalId") approvalId: string, @Body() dto: Record<string, any>) { return this.reviewApproval.transition(user, approvalId, "e-sign", dto); }

  @Get("review-approval/packages/:approvalId/source")
  @Permissions(auditPermissions.reviewPackageView)
  approvalSource(@CurrentUser() user: RequestUser, @Param("approvalId") approvalId: string) { return this.reviewApproval.section(user, approvalId, "source"); }
  @Get("review-approval/packages/:approvalId/snapshot")
  @Permissions(auditPermissions.reviewPackageView)
  approvalSnapshot(@CurrentUser() user: RequestUser, @Param("approvalId") approvalId: string) { return this.reviewApproval.section(user, approvalId, "snapshot"); }
  @Get("review-approval/packages/:approvalId/evidence")
  @Permissions(auditPermissions.reviewPackageView)
  approvalEvidence(@CurrentUser() user: RequestUser, @Param("approvalId") approvalId: string) { return this.reviewApproval.section(user, approvalId, "evidence"); }
  @Get("review-approval/packages/:approvalId/validation")
  @Permissions(auditPermissions.reviewValidationView)
  approvalValidation(@CurrentUser() user: RequestUser, @Param("approvalId") approvalId: string) { return this.reviewApproval.section(user, approvalId, "validation"); }
  @Get("review-approval/packages/:approvalId/stages")
  @Permissions(auditPermissions.reviewPackageView)
  approvalStages(@CurrentUser() user: RequestUser, @Param("approvalId") approvalId: string) { return this.reviewApproval.section(user, approvalId, "stages"); }
  @Get("review-approval/packages/:approvalId/decisions")
  @Permissions(auditPermissions.reviewPackageView)
  approvalDecisions(@CurrentUser() user: RequestUser, @Param("approvalId") approvalId: string) { return this.reviewApproval.section(user, approvalId, "decisions"); }
  @Get("review-approval/packages/:approvalId/e-signatures")
  @Permissions(auditPermissions.reviewEsign)
  approvalPackageEsignatures(@CurrentUser() user: RequestUser, @Param("approvalId") approvalId: string) { return this.reviewApproval.section(user, approvalId, "e-signatures"); }
  @Get("review-approval/packages/:approvalId/conditions")
  @Permissions(auditPermissions.reviewConditionView)
  approvalConditions(@CurrentUser() user: RequestUser, @Param("approvalId") approvalId: string) { return this.reviewApproval.section(user, approvalId, "conditions"); }
  @Post("review-approval/packages/:approvalId/conditions")
  @Permissions(auditPermissions.reviewConditionManage)
  addApprovalCondition(@CurrentUser() user: RequestUser, @Param("approvalId") approvalId: string, @Body() dto: Record<string, any>) { return this.reviewApproval.addCondition(user, approvalId, dto); }
  @Patch("review-approval/packages/:approvalId/conditions/:conditionId")
  @Permissions(auditPermissions.reviewConditionManage)
  updateApprovalCondition(@CurrentUser() user: RequestUser, @Param("approvalId") approvalId: string, @Param("conditionId") conditionId: string, @Body() dto: Record<string, any>) { return this.reviewApproval.updateCondition(user, approvalId, conditionId, dto); }
  @Post("review-approval/packages/:approvalId/conditions/:conditionId/complete")
  @Permissions(auditPermissions.reviewConditionManage)
  completeApprovalCondition(@CurrentUser() user: RequestUser, @Param("approvalId") approvalId: string, @Param("conditionId") conditionId: string, @Body() dto: Record<string, any>) { return this.reviewApproval.conditionTransition(user, approvalId, conditionId, "Completed", dto); }
  @Post("review-approval/packages/:approvalId/conditions/:conditionId/verify")
  @Permissions(auditPermissions.reviewConditionManage)
  verifyApprovalCondition(@CurrentUser() user: RequestUser, @Param("approvalId") approvalId: string, @Param("conditionId") conditionId: string, @Body() dto: Record<string, any>) { return this.reviewApproval.conditionTransition(user, approvalId, conditionId, "Verified", dto); }
  @Get("review-approval/packages/:approvalId/history")
  @Permissions(auditPermissions.reviewHistoryView)
  approvalPackageHistory(@CurrentUser() user: RequestUser, @Param("approvalId") approvalId: string) { return this.reviewApproval.section(user, approvalId, "history"); }

  @Get("review-approval/rules")
  @Permissions(auditPermissions.reviewRuleView)
  reviewRules(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.reviewApproval.rules(user, query); }
  @Post("review-approval/rules")
  @Permissions(auditPermissions.reviewRuleCreate)
  createReviewRule(@CurrentUser() user: RequestUser, @Body() dto: Record<string, any>) { return this.reviewApproval.saveRule(user, dto); }
  @Get("review-approval/rules/:ruleId")
  @Permissions(auditPermissions.reviewRuleView)
  reviewRule(@CurrentUser() user: RequestUser, @Param("ruleId") ruleId: string) { return this.reviewApproval.rule(user, ruleId); }
  @Patch("review-approval/rules/:ruleId")
  @Permissions(auditPermissions.reviewRuleEdit)
  updateReviewRule(@CurrentUser() user: RequestUser, @Param("ruleId") ruleId: string, @Body() dto: Record<string, any>) { return this.reviewApproval.saveRule(user, dto, ruleId); }
  @Post("review-approval/rules/:ruleId/activate")
  @Permissions(auditPermissions.reviewRuleActivate)
  activateReviewRule(@CurrentUser() user: RequestUser, @Param("ruleId") ruleId: string, @Body() dto: Record<string, any>) { return this.reviewApproval.ruleTransition(user, ruleId, "activate", dto); }
  @Post("review-approval/rules/:ruleId/archive")
  @Permissions(auditPermissions.reviewRuleArchive)
  archiveReviewRule(@CurrentUser() user: RequestUser, @Param("ruleId") ruleId: string, @Body() dto: Record<string, any>) { return this.reviewApproval.ruleTransition(user, ruleId, "archive", dto); }

  @Get("review-approval/history")
  @Permissions(auditPermissions.reviewHistoryView)
  reviewHistory(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.reviewApproval.historyEvents(user, query); }
  @Get("review-approval/settings")
  @Permissions(auditPermissions.reviewSettingsView)
  reviewSettings(@CurrentUser() user: RequestUser, @Query("siteId") siteId?: string) { return this.reviewApproval.settings(user, siteId ?? null); }
  @Patch("review-approval/settings")
  @Permissions(auditPermissions.reviewSettingsEdit)
  updateReviewSettings(@CurrentUser() user: RequestUser, @Body() dto: Record<string, any>) { return this.reviewApproval.updateSettings(user, dto); }
  @Get("review-approval/context")
  @Permissions(auditPermissions.reviewView)
  reviewContext(@CurrentUser() user: RequestUser) { return this.reviewApproval.context(user); }

  @Get("sites/:siteId/review-approval")
  @Permissions(auditPermissions.reviewView)
  siteReviewApproval(@CurrentUser() user: RequestUser, @Param("siteId") siteId: string, @Query() query: Record<string, any>) { return this.reviewApproval.packages(user, { ...query, siteId }); }
  @Get("units/:unitId/review-approval")
  @Permissions(auditPermissions.reviewView)
  unitReviewApproval(@CurrentUser() user: RequestUser, @Param("unitId") unitId: string, @Query() query: Record<string, any>) { return this.reviewApproval.packages(user, { ...query, unitId }); }
  @Get("areas/:areaId/review-approval")
  @Permissions(auditPermissions.reviewView)
  areaReviewApproval(@CurrentUser() user: RequestUser, @Param("areaId") areaId: string, @Query() query: Record<string, any>) { return this.reviewApproval.packages(user, { ...query, areaId }); }

  @Post("programs/:programId/submit-review")
  @Permissions(auditPermissions.reviewPackageCreate)
  submitProgramApprovalPackage(@CurrentUser() user: RequestUser, @Param("programId") programId: string, @Body() dto: Record<string, any>) { return this.reviewApproval.sourceSubmit(user, "program", programId, dto); }
  @Get("programs/:programId/review")
  @Permissions(auditPermissions.reviewPackageView)
  programApprovalPackages(@CurrentUser() user: RequestUser, @Param("programId") programId: string, @Query() query: Record<string, any>) { return this.reviewApproval.sourceReview(user, "program", programId, query); }
  @Post("plans/:planId/submit-review")
  @Permissions(auditPermissions.reviewPackageCreate)
  submitPlanApprovalPackage(@CurrentUser() user: RequestUser, @Param("planId") planId: string, @Body() dto: Record<string, any>) { return this.reviewApproval.sourceSubmit(user, "plan", planId, dto); }
  @Get("plans/:planId/review")
  @Permissions(auditPermissions.reviewPackageView)
  planApprovalPackages(@CurrentUser() user: RequestUser, @Param("planId") planId: string, @Query() query: Record<string, any>) { return this.reviewApproval.sourceReview(user, "plan", planId, query); }
  @Post("checklists/templates/:checklistId/submit-review")
  @Permissions(auditPermissions.reviewPackageCreate)
  submitChecklistApprovalPackage(@CurrentUser() user: RequestUser, @Param("checklistId") checklistId: string, @Body() dto: Record<string, any>) { return this.reviewApproval.sourceSubmit(user, "checklist", checklistId, dto); }
  @Get("checklists/templates/:checklistId/review")
  @Permissions(auditPermissions.reviewPackageView)
  checklistApprovalPackages(@CurrentUser() user: RequestUser, @Param("checklistId") checklistId: string, @Query() query: Record<string, any>) { return this.reviewApproval.sourceReview(user, "checklist", checklistId, query); }
  @Post("execution/:executionId/submit-review")
  @Permissions(auditPermissions.reviewPackageCreate)
  submitExecutionApprovalPackage(@CurrentUser() user: RequestUser, @Param("executionId") executionId: string, @Body() dto: Record<string, any>) { return this.reviewApproval.sourceSubmit(user, "execution", executionId, dto); }
  @Get("execution/:executionId/review")
  @Permissions(auditPermissions.reviewPackageView)
  executionApprovalPackages(@CurrentUser() user: RequestUser, @Param("executionId") executionId: string, @Query() query: Record<string, any>) { return this.reviewApproval.sourceReview(user, "execution", executionId, query); }
  @Post("findings/:findingId/submit-review")
  @Permissions(auditPermissions.reviewPackageCreate)
  submitFindingApprovalPackage(@CurrentUser() user: RequestUser, @Param("findingId") findingId: string, @Body() dto: Record<string, any>) { return this.reviewApproval.sourceSubmit(user, "finding", findingId, dto); }
  @Get("findings/:findingId/review")
  @Permissions(auditPermissions.reviewPackageView)
  findingApprovalPackages(@CurrentUser() user: RequestUser, @Param("findingId") findingId: string, @Query() query: Record<string, any>) { return this.reviewApproval.sourceReview(user, "finding", findingId, query); }
  @Post("capa/:capaId/submit-review")
  @Permissions(auditPermissions.reviewPackageCreate)
  submitCapaApprovalPackage(@CurrentUser() user: RequestUser, @Param("capaId") capaId: string, @Body() dto: Record<string, any>) { return this.reviewApproval.sourceSubmit(user, "capa", capaId, dto); }
  @Get("capa/:capaId/review")
  @Permissions(auditPermissions.reviewPackageView)
  capaApprovalPackages(@CurrentUser() user: RequestUser, @Param("capaId") capaId: string, @Query() query: Record<string, any>) { return this.reviewApproval.sourceReview(user, "capa", capaId, query); }
  @Post("evidence/:evidenceId/submit-review")
  @Permissions(auditPermissions.reviewPackageCreate)
  submitEvidenceApprovalPackage(@CurrentUser() user: RequestUser, @Param("evidenceId") evidenceId: string, @Body() dto: Record<string, any>) { return this.reviewApproval.sourceSubmit(user, "evidence", evidenceId, dto); }
  @Get("evidence/:evidenceId/review")
  @Permissions(auditPermissions.reviewPackageView)
  evidenceApprovalPackages(@CurrentUser() user: RequestUser, @Param("evidenceId") evidenceId: string, @Query() query: Record<string, any>) { return this.reviewApproval.sourceReview(user, "evidence", evidenceId, query); }
  @Post("scoring/runs/:runId/submit-review")
  @Permissions(auditPermissions.reviewPackageCreate)
  submitScoreRunReview(@CurrentUser() user: RequestUser, @Param("runId") runId: string, @Body() dto: Record<string, any>) { return this.reviewApproval.sourceSubmit(user, "score-run", runId, dto); }
  @Get("scoring/runs/:runId/review")
  @Permissions(auditPermissions.reviewPackageView)
  scoreRunReview(@CurrentUser() user: RequestUser, @Param("runId") runId: string, @Query() query: Record<string, any>) { return this.reviewApproval.sourceReview(user, "score-run", runId, query); }
  @Post("standards-mapping/:mappingId/submit-review")
  @Permissions(auditPermissions.reviewPackageCreate)
  submitStandardsMappingReview(@CurrentUser() user: RequestUser, @Param("mappingId") mappingId: string, @Body() dto: Record<string, any>) { return this.reviewApproval.sourceSubmit(user, "standards-mapping", mappingId, dto); }
  @Get("standards-mapping/:mappingId/review")
  @Permissions(auditPermissions.reviewPackageView)
  standardsMappingReview(@CurrentUser() user: RequestUser, @Param("mappingId") mappingId: string, @Query() query: Record<string, any>) { return this.reviewApproval.sourceReview(user, "standards-mapping", mappingId, query); }

  @Get("lookups/approval-package-statuses")
  @Permissions(auditPermissions.reviewView)
  approvalPackageStatuses() { return this.reviewApproval.lookups().packageStatuses; }
  @Get("lookups/approval-stage-statuses")
  @Permissions(auditPermissions.reviewView)
  approvalStageStatuses() { return this.reviewApproval.lookups().stageStatuses; }
  @Get("lookups/approval-decisions")
  @Permissions(auditPermissions.reviewView)
  approvalDecisionsLookup() { return this.reviewApproval.lookups().approvalDecisions; }
  @Get("lookups/approval-validation-statuses")
  @Permissions(auditPermissions.reviewView)
  approvalValidationStatuses() { return this.reviewApproval.lookups().validationStatuses; }
  @Get("lookups/approval-rule-triggers")
  @Permissions(auditPermissions.reviewView)
  approvalRuleTriggers() { return this.reviewApproval.lookups().ruleTriggers; }
  @Get("lookups/approval-source-modules")
  @Permissions(auditPermissions.reviewView)
  approvalSourceModules() { return this.reviewApproval.lookups().sourceModules; }
  @Get("lookups/reviewer-selection-methods")
  @Permissions(auditPermissions.reviewView)
  reviewerSelectionMethods() { return this.reviewApproval.lookups().reviewerSelectionMethods; }
  @Get("lookups/approval-condition-statuses")
  @Permissions(auditPermissions.reviewView)
  approvalConditionStatuses() { return this.reviewApproval.lookups().conditionStatuses; }

  @Get("standards-mapping/dashboard")
  @Permissions(auditPermissions.standardsMappingDashboardView)
  standardsMappingDashboard(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.standardsMapping.dashboard(user, query); }
  @Get("standards-mapping/dashboard/summary")
  @Permissions(auditPermissions.standardsMappingDashboardView)
  async standardsMappingDashboardSummary(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return (await this.standardsMapping.dashboard(user, query)).summary; }
  @Get("standards-mapping/dashboard/by-standard")
  @Permissions(auditPermissions.standardsMappingDashboardView)
  async standardsMappingDashboardByStandard(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return (await this.standardsMapping.dashboard(user, query)).byStandard; }
  @Get("standards-mapping/dashboard/by-site")
  @Permissions(auditPermissions.standardsMappingDashboardView)
  async standardsMappingDashboardBySite(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return (await this.standardsMapping.dashboard(user, query)).bySite; }
  @Get("standards-mapping/dashboard/by-module")
  @Permissions(auditPermissions.standardsMappingDashboardView)
  async standardsMappingDashboardByModule(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return (await this.standardsMapping.dashboard(user, query)).byModule; }
  @Get("standards-mapping/dashboard/gaps")
  @Permissions(auditPermissions.standardsMappingGapView)
  async standardsMappingDashboardGaps(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return (await this.standardsMapping.dashboard(user, query)).gaps; }
  @Get("standards-mapping/dashboard/stale")
  @Permissions(auditPermissions.standardsMappingStaleView)
  async standardsMappingDashboardStale(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return (await this.standardsMapping.dashboard(user, query)).stale; }
  @Get("standards-mapping/dashboard/recent")
  @Permissions(auditPermissions.standardsMappingDashboardView)
  async standardsMappingDashboardRecent(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return (await this.standardsMapping.dashboard(user, query)).recent; }

  @Get("standards-mapping/context")
  @Permissions(auditPermissions.standardsMappingView)
  standardsMappingContext(@CurrentUser() user: RequestUser) { return this.standardsMapping.context(user); }
  @Get("standards-mapping/lookups")
  @Permissions(auditPermissions.standardsMappingView)
  standardsMappingLookups() { return this.standardsMapping.lookups(); }
  @Get("standards-mapping/settings")
  @Permissions(auditPermissions.standardsMappingSettingsView)
  standardsMappingSettings(@CurrentUser() user: RequestUser, @Query("siteId") siteId?: string) { return this.standardsMapping.settings(user, siteId ?? null); }
  @Patch("standards-mapping/settings")
  @Permissions(auditPermissions.standardsMappingSettingsEdit)
  updateStandardsMappingSettings(@CurrentUser() user: RequestUser, @Body() dto: Record<string, any>) { return this.standardsMapping.updateSettings(user, dto); }
  @Get("standards-mapping/history")
  @Permissions(auditPermissions.standardsMappingHistoryView)
  standardsMappingHistory(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.standardsMapping.historyEvents(user, query); }

  @Get("standards-mapping/standards")
  @Permissions(auditPermissions.standardsMappingStandardView)
  auditStandards(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.standardsMapping.standards(user, query); }
  @Post("standards-mapping/standards")
  @Permissions(auditPermissions.standardsMappingStandardCreate)
  createAuditStandard(@CurrentUser() user: RequestUser, @Body() dto: Record<string, any>) { return this.standardsMapping.saveStandard(user, dto); }
  @Get("standards-mapping/standards/:standardId")
  @Permissions(auditPermissions.standardsMappingStandardView)
  auditStandard(@CurrentUser() user: RequestUser, @Param("standardId") standardId: string) { return this.standardsMapping.standard(user, standardId); }
  @Patch("standards-mapping/standards/:standardId")
  @Permissions(auditPermissions.standardsMappingStandardEdit)
  updateAuditStandard(@CurrentUser() user: RequestUser, @Param("standardId") standardId: string, @Body() dto: Record<string, any>) { return this.standardsMapping.saveStandard(user, dto, standardId); }
  @Post("standards-mapping/standards/:standardId/archive")
  @Permissions(auditPermissions.standardsMappingStandardArchive)
  archiveAuditStandard(@CurrentUser() user: RequestUser, @Param("standardId") standardId: string, @Body() dto: Record<string, any>) { return this.standardsMapping.saveStandard(user, { ...dto, standardStatus: "Archived" }, standardId); }
  @Post("standards-mapping/standards/:standardId/reactivate")
  @Permissions(auditPermissions.standardsMappingStandardEdit)
  reactivateAuditStandard(@CurrentUser() user: RequestUser, @Param("standardId") standardId: string, @Body() dto: Record<string, any>) { return this.standardsMapping.saveStandard(user, { ...dto, standardStatus: "Active" }, standardId); }

  @Get("standards-mapping/clauses")
  @Permissions(auditPermissions.standardsMappingClauseView)
  auditClauses(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.standardsMapping.clauses(user, query); }
  @Post("standards-mapping/clauses")
  @Permissions(auditPermissions.standardsMappingClauseCreate)
  createAuditClause(@CurrentUser() user: RequestUser, @Body() dto: Record<string, any>) { return this.standardsMapping.saveClause(user, dto); }
  @Get("standards-mapping/clauses/:clauseId")
  @Permissions(auditPermissions.standardsMappingClauseView)
  auditClause(@CurrentUser() user: RequestUser, @Param("clauseId") clauseId: string) { return this.standardsMapping.clause(user, clauseId); }
  @Patch("standards-mapping/clauses/:clauseId")
  @Permissions(auditPermissions.standardsMappingClauseEdit)
  updateAuditClause(@CurrentUser() user: RequestUser, @Param("clauseId") clauseId: string, @Body() dto: Record<string, any>) { return this.standardsMapping.saveClause(user, dto, clauseId); }
  @Post("standards-mapping/clauses/:clauseId/archive")
  @Permissions(auditPermissions.standardsMappingClauseArchive)
  archiveAuditClause(@CurrentUser() user: RequestUser, @Param("clauseId") clauseId: string, @Body() dto: Record<string, any>) { return this.standardsMapping.saveClause(user, { ...dto, archivedAt: new Date().toISOString() }, clauseId); }

  @Get("standards-mapping/register")
  @Permissions(auditPermissions.standardsMappingRegisterView)
  standardsMappingRegister(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.standardsMapping.register(user, query); }
  @Get("standards-mapping/coverage-matrix")
  @Permissions(auditPermissions.standardsMappingCoverageView)
  standardsMappingCoverageMatrix(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.standardsMapping.coverageMatrix(user, query); }
  @Get("standards-mapping/coverage/by-standard")
  @Permissions(auditPermissions.standardsMappingCoverageView)
  standardsMappingCoverageByStandard(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.standardsMapping.coverageMatrix(user, query); }
  @Get("standards-mapping/coverage/by-clause")
  @Permissions(auditPermissions.standardsMappingCoverageView)
  standardsMappingCoverageByClause(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.standardsMapping.coverageMatrix(user, query); }
  @Get("standards-mapping/coverage/by-module")
  @Permissions(auditPermissions.standardsMappingCoverageView)
  standardsMappingCoverageByModule(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.standardsMapping.coverageMatrix(user, query); }
  @Get("standards-mapping/coverage/by-site")
  @Permissions(auditPermissions.standardsMappingCoverageView)
  standardsMappingCoverageBySite(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.standardsMapping.coverageMatrix(user, query); }
  @Post("standards-mapping/coverage/recalculate")
  @Permissions(auditPermissions.standardsMappingCoverageRecalculate)
  recalculateStandardsMappingCoverage(@CurrentUser() user: RequestUser, @Body() dto: Record<string, any>) { return this.standardsMapping.recalculate(user, dto.mappingId ?? dto.mapping_id); }
  @Get("standards-mapping/traceability")
  @Permissions(auditPermissions.standardsMappingTraceabilityView)
  standardsMappingTraceability(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.standardsMapping.traceability(user, query); }
  @Get("standards-mapping/gaps")
  @Permissions(auditPermissions.standardsMappingGapView)
  standardsMappingGaps(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.standardsMapping.gaps(user, query); }
  @Post("standards-mapping/gaps/detect")
  @Permissions(auditPermissions.standardsMappingGapManage)
  detectStandardsMappingGaps(@CurrentUser() user: RequestUser, @Body() dto: Record<string, any>) { return this.standardsMapping.recalculate(user, dto.mappingId ?? dto.mapping_id); }
  @Post("standards-mapping/gaps")
  @Permissions(auditPermissions.standardsMappingGapManage)
  createStandardsMappingGap(@CurrentUser() user: RequestUser, @Body() dto: Record<string, any>) { return this.standardsMapping.createGap(user, dto); }
  @Patch("standards-mapping/gaps/:gapId")
  @Permissions(auditPermissions.standardsMappingGapManage)
  updateStandardsMappingGap(@CurrentUser() user: RequestUser, @Param("gapId") gapId: string, @Body() dto: Record<string, any>) { return this.standardsMapping.resolveGap(user, gapId, dto); }
  @Post("standards-mapping/gaps/:gapId/resolve")
  @Permissions(auditPermissions.standardsMappingGapManage)
  resolveStandardsMappingGap(@CurrentUser() user: RequestUser, @Param("gapId") gapId: string, @Body() dto: Record<string, any>) { return this.standardsMapping.resolveGap(user, gapId, dto); }
  @Post("standards-mapping/gaps/:gapId/create-action-foundation")
  @Permissions(auditPermissions.standardsMappingGapManage)
  createGapActionFoundation(@CurrentUser() user: RequestUser, @Param("gapId") gapId: string, @Body() dto: Record<string, any>) { return this.standardsMapping.resolveGap(user, gapId, { ...dto, status: "In Progress", resolutionNote: dto.reason ?? "Action foundation requested." }); }
  @Get("standards-mapping/stale")
  @Permissions(auditPermissions.standardsMappingStaleView)
  standardsMappingStale(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.standardsMapping.viewFilter(user, "stale", query); }
  @Get("standards-mapping/pending-review")
  @Permissions(auditPermissions.standardsMappingMappingView)
  standardsMappingPendingReview(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.standardsMapping.viewFilter(user, "pending-review", query); }
  @Get("standards-mapping/verified")
  @Permissions(auditPermissions.standardsMappingMappingView)
  standardsMappingVerified(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.standardsMapping.viewFilter(user, "verified", query); }
  @Get("standards-mapping/archived")
  @Permissions(auditPermissions.standardsMappingMappingView)
  standardsMappingArchived(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.standardsMapping.viewFilter(user, "archived", query); }
  @Get("standards-mapping")
  @Permissions(auditPermissions.standardsMappingMappingView)
  standardsMappings(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.standardsMapping.register(user, query); }
  @Post("standards-mapping")
  @Permissions(auditPermissions.standardsMappingMappingCreate)
  createStandardsMapping(@CurrentUser() user: RequestUser, @Body() dto: Record<string, any>) { return this.standardsMapping.saveMapping(user, dto); }
  @Get("standards-mapping/:mappingId")
  @Permissions(auditPermissions.standardsMappingMappingView)
  standardsMappingDetail(@CurrentUser() user: RequestUser, @Param("mappingId") mappingId: string) { return this.standardsMapping.detail(user, mappingId); }
  @Patch("standards-mapping/:mappingId")
  @Permissions(auditPermissions.standardsMappingMappingEdit)
  updateStandardsMapping(@CurrentUser() user: RequestUser, @Param("mappingId") mappingId: string, @Body() dto: Record<string, any>) { return this.standardsMapping.saveMapping(user, dto, mappingId); }
  @Post("standards-mapping/:mappingId/link")
  @Permissions(auditPermissions.standardsMappingMappingLink)
  linkStandardsMapping(@CurrentUser() user: RequestUser, @Param("mappingId") mappingId: string, @Body() dto: Record<string, any>) { return this.standardsMapping.link(user, mappingId, dto); }
  @Delete("standards-mapping/:mappingId/links/:linkId")
  @Permissions(auditPermissions.standardsMappingMappingUnlink)
  unlinkStandardsMapping(@CurrentUser() user: RequestUser, @Param("mappingId") mappingId: string, @Param("linkId") linkId: string, @Body() dto: Record<string, any>) { return this.standardsMapping.unlink(user, mappingId, linkId, dto); }
  @Post("standards-mapping/:mappingId/recalculate")
  @Permissions(auditPermissions.standardsMappingCoverageRecalculate)
  recalculateStandardsMapping(@CurrentUser() user: RequestUser, @Param("mappingId") mappingId: string) { return this.standardsMapping.recalculate(user, mappingId); }
  @Post("standards-mapping/:mappingId/verify")
  @Permissions(auditPermissions.standardsMappingMappingVerify)
  verifyStandardsMapping(@CurrentUser() user: RequestUser, @Param("mappingId") mappingId: string, @Body() dto: Record<string, any>) { return this.standardsMapping.transition(user, mappingId, "verify", dto); }
  @Post("standards-mapping/:mappingId/mark-stale")
  @Permissions(auditPermissions.standardsMappingMappingEdit)
  markStandardsMappingStale(@CurrentUser() user: RequestUser, @Param("mappingId") mappingId: string, @Body() dto: Record<string, any>) { return this.standardsMapping.transition(user, mappingId, "mark-stale", dto); }
  @Post("standards-mapping/:mappingId/archive")
  @Permissions(auditPermissions.standardsMappingMappingArchive)
  archiveStandardsMapping(@CurrentUser() user: RequestUser, @Param("mappingId") mappingId: string, @Body() dto: Record<string, any>) { return this.standardsMapping.transition(user, mappingId, "archive", dto); }
  @Post("standards-mapping/:mappingId/reopen")
  @Permissions(auditPermissions.standardsMappingMappingEdit)
  reopenStandardsMapping(@CurrentUser() user: RequestUser, @Param("mappingId") mappingId: string, @Body() dto: Record<string, any>) { return this.standardsMapping.transition(user, mappingId, "reopen", dto); }
  @Get("standards-mapping/:mappingId/traceability")
  @Permissions(auditPermissions.standardsMappingTraceabilityView)
  async standardsMappingTraceabilityDetail(@CurrentUser() user: RequestUser, @Param("mappingId") mappingId: string) { return (await this.standardsMapping.detail(user, mappingId)).latestTraceability; }
  @Post("standards-mapping/:mappingId/generate-traceability-snapshot")
  @Permissions(auditPermissions.standardsMappingTraceabilityView)
  generateStandardsMappingTraceabilitySnapshot(@CurrentUser() user: RequestUser, @Param("mappingId") mappingId: string) { return this.standardsMapping.snapshotTraceability(user, mappingId); }
  @Get("standards-mapping/:mappingId/overrides")
  @Permissions(auditPermissions.standardsMappingOverrideCreate)
  async standardsMappingOverrides(@CurrentUser() user: RequestUser, @Param("mappingId") mappingId: string) { return (await this.standardsMapping.detail(user, mappingId)).overrides; }
  @Post("standards-mapping/:mappingId/overrides")
  @Permissions(auditPermissions.standardsMappingOverrideCreate)
  createStandardsMappingOverride(@CurrentUser() user: RequestUser, @Param("mappingId") mappingId: string, @Body() dto: Record<string, any>) { return this.standardsMapping.createOverride(user, mappingId, dto); }
  @Post("standards-mapping/:mappingId/overrides/:overrideId/approve")
  @Permissions(auditPermissions.standardsMappingOverrideApprove)
  approveStandardsMappingOverride(@CurrentUser() user: RequestUser, @Param("mappingId") mappingId: string, @Param("overrideId") overrideId: string, @Body() dto: Record<string, any>) { return this.standardsMapping.overrideTransition(user, mappingId, overrideId, "approve", dto); }
  @Post("standards-mapping/:mappingId/overrides/:overrideId/reject")
  @Permissions(auditPermissions.standardsMappingOverrideApprove)
  rejectStandardsMappingOverride(@CurrentUser() user: RequestUser, @Param("mappingId") mappingId: string, @Param("overrideId") overrideId: string, @Body() dto: Record<string, any>) { return this.standardsMapping.overrideTransition(user, mappingId, overrideId, "reject", dto); }
  @Post("standards-mapping/:mappingId/overrides/:overrideId/remove")
  @Permissions(auditPermissions.standardsMappingOverrideRemove)
  removeStandardsMappingOverride(@CurrentUser() user: RequestUser, @Param("mappingId") mappingId: string, @Param("overrideId") overrideId: string, @Body() dto: Record<string, any>) { return this.standardsMapping.overrideTransition(user, mappingId, overrideId, "remove", dto); }

  @Get("programs/:programId/standards-mapping")
  @Permissions(auditPermissions.standardsMappingMappingView)
  programStandardsMappings(@CurrentUser() user: RequestUser, @Param("programId") programId: string, @Query() query: Record<string, any>) { return this.standardsMapping.sourceMappings(user, "program", programId, query); }
  @Get("plans/:planId/standards-mapping")
  @Permissions(auditPermissions.standardsMappingMappingView)
  planStandardsMappings(@CurrentUser() user: RequestUser, @Param("planId") planId: string, @Query() query: Record<string, any>) { return this.standardsMapping.sourceMappings(user, "plan", planId, query); }
  @Get("checklists/templates/:checklistId/standards-mapping")
  @Permissions(auditPermissions.standardsMappingMappingView)
  checklistStandardsMappings(@CurrentUser() user: RequestUser, @Param("checklistId") checklistId: string, @Query() query: Record<string, any>) { return this.standardsMapping.sourceMappings(user, "checklist", checklistId, query); }
  @Get("execution/:executionId/standards-mapping")
  @Permissions(auditPermissions.standardsMappingMappingView)
  executionStandardsMappings(@CurrentUser() user: RequestUser, @Param("executionId") executionId: string, @Query() query: Record<string, any>) { return this.standardsMapping.sourceMappings(user, "execution", executionId, query); }
  @Get("findings/:findingId/standards-mapping")
  @Permissions(auditPermissions.standardsMappingMappingView)
  findingStandardsMappings(@CurrentUser() user: RequestUser, @Param("findingId") findingId: string, @Query() query: Record<string, any>) { return this.standardsMapping.sourceMappings(user, "finding", findingId, query); }
  @Get("capa/:capaId/standards-mapping")
  @Permissions(auditPermissions.standardsMappingMappingView)
  capaStandardsMappings(@CurrentUser() user: RequestUser, @Param("capaId") capaId: string, @Query() query: Record<string, any>) { return this.standardsMapping.sourceMappings(user, "capa", capaId, query); }
  @Get("evidence/:evidenceId/standards-mapping")
  @Permissions(auditPermissions.standardsMappingMappingView)
  evidenceStandardsMappings(@CurrentUser() user: RequestUser, @Param("evidenceId") evidenceId: string, @Query() query: Record<string, any>) { return this.standardsMapping.sourceMappings(user, "evidence", evidenceId, query); }
  @Get("scoring/runs/:runId/standards-mapping")
  @Permissions(auditPermissions.standardsMappingMappingView)
  scoreRunStandardsMappings(@CurrentUser() user: RequestUser, @Param("runId") runId: string, @Query() query: Record<string, any>) { return this.standardsMapping.sourceMappings(user, "score-run", runId, query); }
  @Get("sites/:siteId/standards-mapping")
  @Permissions(auditPermissions.standardsMappingMappingView)
  siteStandardsMappings(@CurrentUser() user: RequestUser, @Param("siteId") siteId: string, @Query() query: Record<string, any>) { return this.standardsMapping.sourceMappings(user, "site", siteId, query); }
  @Get("units/:unitId/standards-mapping")
  @Permissions(auditPermissions.standardsMappingMappingView)
  unitStandardsMappings(@CurrentUser() user: RequestUser, @Param("unitId") unitId: string, @Query() query: Record<string, any>) { return this.standardsMapping.sourceMappings(user, "unit", unitId, query); }
  @Get("areas/:areaId/standards-mapping")
  @Permissions(auditPermissions.standardsMappingMappingView)
  areaStandardsMappings(@CurrentUser() user: RequestUser, @Param("areaId") areaId: string, @Query() query: Record<string, any>) { return this.standardsMapping.sourceMappings(user, "area", areaId, query); }

  @Get("scoring/dashboard")
  @Permissions(auditPermissions.scoringDashboardView)
  scoringDashboard(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.scoring.dashboard(user, query); }
  @Get("scoring/dashboard/summary")
  @Permissions(auditPermissions.scoringDashboardView)
  async scoringDashboardSummary(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return (await this.scoring.dashboard(user, query)).summary; }
  @Get("scoring/dashboard/by-site")
  @Permissions(auditPermissions.scoringDashboardView)
  async scoringDashboardBySite(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return (await this.scoring.dashboard(user, query)).bySite; }
  @Get("scoring/dashboard/by-module")
  @Permissions(auditPermissions.scoringDashboardView)
  async scoringDashboardByModule(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return (await this.scoring.dashboard(user, query)).byModule; }
  @Get("scoring/dashboard/by-standard")
  @Permissions(auditPermissions.scoringDashboardView)
  async scoringDashboardByStandard(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return (await this.scoring.dashboard(user, query)).byStandard; }
  @Get("scoring/dashboard/stale")
  @Permissions(auditPermissions.scoringStaleView)
  async scoringDashboardStale(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return (await this.scoring.dashboard(user, query)).stale; }
  @Get("scoring/dashboard/critical-blockers")
  @Permissions(auditPermissions.scoringDashboardView)
  async scoringDashboardCriticalBlockers(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return (await this.scoring.dashboard(user, query)).criticalBlockers; }
  @Get("scoring/dashboard/recent")
  @Permissions(auditPermissions.scoringDashboardView)
  async scoringDashboardRecent(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return (await this.scoring.dashboard(user, query)).recent; }

  @Get("scoring/context")
  @Permissions(auditPermissions.scoringView)
  scoringContext(@CurrentUser() user: RequestUser) { return this.scoring.context(user); }
  @Get("scoring/settings")
  @Permissions(auditPermissions.scoringSettingsView)
  scoringSettings(@CurrentUser() user: RequestUser, @Query("siteId") siteId?: string) { return this.scoring.settings(user, siteId ?? null); }
  @Patch("scoring/settings")
  @Permissions(auditPermissions.scoringSettingsEdit)
  updateScoringSettings(@CurrentUser() user: RequestUser, @Body() dto: Record<string, any>) { return this.scoring.updateSettings(user, dto); }
  @Get("scoring/history")
  @Permissions(auditPermissions.scoringHistoryView)
  scoringHistory(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.scoring.globalHistory(user, query); }

  @Get("scoring/register")
  @Permissions(auditPermissions.scoringRegisterView)
  scoringRegister(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.scoring.register(user, query); }
  @Get("scoring/scorecards")
  @Permissions(auditPermissions.scoringRegisterView)
  scoringScorecards(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.scoring.register(user, query); }
  @Get("scoring/by-site")
  @Permissions(auditPermissions.scoringRegisterView)
  scoringBySite(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.scoring.viewFilter(user, "by-site", query); }
  @Get("scoring/by-unit")
  @Permissions(auditPermissions.scoringRegisterView)
  scoringByUnit(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.scoring.viewFilter(user, "by-unit", query); }
  @Get("scoring/by-module")
  @Permissions(auditPermissions.scoringRegisterView)
  scoringByModule(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.scoring.viewFilter(user, "by-module", query); }
  @Get("scoring/by-standard")
  @Permissions(auditPermissions.scoringRegisterView)
  scoringByStandard(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.scoring.viewFilter(user, "by-standard", query); }
  @Get("scoring/by-clause")
  @Permissions(auditPermissions.scoringRegisterView)
  scoringByClause(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.scoring.viewFilter(user, "by-clause", query); }
  @Get("scoring/by-program")
  @Permissions(auditPermissions.scoringRegisterView)
  scoringByProgram(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.scoring.viewFilter(user, "by-program", query); }
  @Get("scoring/by-plan")
  @Permissions(auditPermissions.scoringRegisterView)
  scoringByPlan(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.scoring.viewFilter(user, "by-plan", query); }
  @Get("scoring/by-execution")
  @Permissions(auditPermissions.scoringRegisterView)
  scoringByExecution(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.scoring.viewFilter(user, "by-execution", query); }
  @Get("scoring/stale")
  @Permissions(auditPermissions.scoringStaleView)
  scoringStale(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.scoring.viewFilter(user, "stale", query); }
  @Get("scoring/pending-verification")
  @Permissions(auditPermissions.scoringRunVerify)
  scoringPendingVerification(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.scoring.viewFilter(user, "pending-verification", query); }
  @Get("scoring/adjusted")
  @Permissions(auditPermissions.scoringAdjustmentView)
  scoringAdjusted(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.scoring.viewFilter(user, "adjusted", query); }
  @Get("scoring/locked")
  @Permissions(auditPermissions.scoringRunView)
  scoringLocked(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.scoring.viewFilter(user, "locked", query); }

  @Get("scoring/models/:modelId/rules")
  @Permissions(auditPermissions.scoringRuleView)
  scoringRules(@CurrentUser() user: RequestUser, @Param("modelId") modelId: string) { return this.scoring.rules(user, modelId); }
  @Post("scoring/models/:modelId/rules")
  @Permissions(auditPermissions.scoringRuleManage)
  createScoringRule(@CurrentUser() user: RequestUser, @Param("modelId") modelId: string, @Body() dto: Record<string, any>) { return this.scoring.saveRule(user, modelId, dto); }
  @Patch("scoring/models/:modelId/rules/:ruleId")
  @Permissions(auditPermissions.scoringRuleManage)
  updateScoringRule(@CurrentUser() user: RequestUser, @Param("modelId") modelId: string, @Param("ruleId") ruleId: string, @Body() dto: Record<string, any>) { return this.scoring.saveRule(user, modelId, dto, ruleId); }
  @Delete("scoring/models/:modelId/rules/:ruleId")
  @Permissions(auditPermissions.scoringRuleManage)
  deleteScoringRule(@CurrentUser() user: RequestUser, @Param("modelId") modelId: string, @Param("ruleId") ruleId: string, @Body() dto: Record<string, any>) { return this.scoring.removeRule(user, modelId, ruleId, dto); }
  @Post("scoring/models/:modelId/rules/reorder")
  @Permissions(auditPermissions.scoringRuleManage)
  reorderScoringRules(@CurrentUser() user: RequestUser, @Param("modelId") modelId: string, @Body() dto: Record<string, any>) { return this.scoring.reorderRules(user, modelId, dto); }
  @Get("scoring/models")
  @Permissions(auditPermissions.scoringModelView)
  scoringModels(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.scoring.models(user, query); }
  @Post("scoring/models")
  @Permissions(auditPermissions.scoringModelCreate)
  createScoringModel(@CurrentUser() user: RequestUser, @Body() dto: Record<string, any>) { return this.scoring.saveModel(user, dto); }
  @Get("scoring/models/:modelId")
  @Permissions(auditPermissions.scoringModelView)
  scoringModelDetail(@CurrentUser() user: RequestUser, @Param("modelId") modelId: string) { return this.scoring.modelDetail(user, modelId); }
  @Patch("scoring/models/:modelId")
  @Permissions(auditPermissions.scoringModelEdit)
  patchScoringModel(@CurrentUser() user: RequestUser, @Param("modelId") modelId: string, @Body() dto: Record<string, any>) { return this.scoring.saveModel(user, dto, modelId); }
  @Post("scoring/models/:modelId/activate")
  @Permissions(auditPermissions.scoringModelActivate)
  activateScoringModel(@CurrentUser() user: RequestUser, @Param("modelId") modelId: string) { return this.scoring.modelTransition(user, modelId, "activate"); }
  @Post("scoring/models/:modelId/create-version")
  @Permissions(auditPermissions.scoringModelCreate)
  versionScoringModel(@CurrentUser() user: RequestUser, @Param("modelId") modelId: string) { return this.scoring.modelTransition(user, modelId, "create-version"); }
  @Post("scoring/models/:modelId/archive")
  @Permissions(auditPermissions.scoringModelArchive)
  archiveScoringModel(@CurrentUser() user: RequestUser, @Param("modelId") modelId: string, @Body() dto: Record<string, any>) { return this.scoring.modelTransition(user, modelId, "archive", dto); }

  @Get("scoring/runs/:runId/input-snapshot")
  @Permissions(auditPermissions.scoringRunView)
  async scoringRunInputSnapshot(@CurrentUser() user: RequestUser, @Param("runId") runId: string) { return (await this.scoring.detail(user, runId)).scoreRun.input_snapshot_json; }
  @Get("scoring/runs/:runId/results")
  @Permissions(auditPermissions.scoringRunView)
  async scoringRunResults(@CurrentUser() user: RequestUser, @Param("runId") runId: string) { const detail = await this.scoring.detail(user, runId); return { scoreRun: detail.scoreRun, components: detail.components, ruleResults: detail.ruleResults }; }
  @Get("scoring/runs/:runId/explainability")
  @Permissions(auditPermissions.scoringExplainabilityView)
  async scoringRunExplainability(@CurrentUser() user: RequestUser, @Param("runId") runId: string) { return (await this.scoring.detail(user, runId)).explainability; }
  @Get("scoring/runs/:runId/traceability")
  @Permissions(auditPermissions.scoringTraceabilityView)
  async scoringRunTraceability(@CurrentUser() user: RequestUser, @Param("runId") runId: string) { return (await this.scoring.detail(user, runId)).traceability; }
  @Get("scoring/runs/:runId/history")
  @Permissions(auditPermissions.scoringHistoryView)
  async scoringRunHistory(@CurrentUser() user: RequestUser, @Param("runId") runId: string) { return (await this.scoring.detail(user, runId)).history; }
  @Get("scoring/runs/:runId/adjustments")
  @Permissions(auditPermissions.scoringAdjustmentView)
  scoringAdjustments(@CurrentUser() user: RequestUser, @Param("runId") runId: string) { return this.scoring.adjustments(user, runId); }
  @Post("scoring/runs/:runId/adjustments")
  @Permissions(auditPermissions.scoringAdjustmentCreate)
  createScoreAdjustment(@CurrentUser() user: RequestUser, @Param("runId") runId: string, @Body() dto: Record<string, any>) { return this.scoring.createAdjustment(user, runId, dto); }
  @Post("scoring/runs/:runId/adjustments/:adjustmentId/approve")
  @Permissions(auditPermissions.scoringAdjustmentApprove)
  approveScoreAdjustment(@CurrentUser() user: RequestUser, @Param("runId") runId: string, @Param("adjustmentId") adjustmentId: string, @Body() dto: Record<string, any>) { return this.scoring.adjustmentTransition(user, runId, adjustmentId, "approve", dto); }
  @Post("scoring/runs/:runId/adjustments/:adjustmentId/reject")
  @Permissions(auditPermissions.scoringAdjustmentApprove)
  rejectScoreAdjustment(@CurrentUser() user: RequestUser, @Param("runId") runId: string, @Param("adjustmentId") adjustmentId: string, @Body() dto: Record<string, any>) { return this.scoring.adjustmentTransition(user, runId, adjustmentId, "reject", dto); }
  @Post("scoring/runs/:runId/adjustments/:adjustmentId/remove")
  @Permissions(auditPermissions.scoringAdjustmentRemove)
  removeScoreAdjustment(@CurrentUser() user: RequestUser, @Param("runId") runId: string, @Param("adjustmentId") adjustmentId: string, @Body() dto: Record<string, any>) { return this.scoring.adjustmentTransition(user, runId, adjustmentId, "remove", dto); }
  @Get("scoring/runs")
  @Permissions(auditPermissions.scoringRunView)
  scoringRuns(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.scoring.register(user, query); }
  @Post("scoring/runs")
  @Permissions(auditPermissions.scoringRunCreate)
  createScoringRun(@CurrentUser() user: RequestUser, @Body() dto: Record<string, any>) { return this.scoring.createRun(user, dto); }
  @Get("scoring/runs/:runId")
  @Permissions(auditPermissions.scoringRunView)
  scoringRunDetail(@CurrentUser() user: RequestUser, @Param("runId") runId: string) { return this.scoring.detail(user, runId); }
  @Post("scoring/runs/:runId/recalculate")
  @Permissions(auditPermissions.scoringRunRecalculate)
  recalculateScoringRun(@CurrentUser() user: RequestUser, @Param("runId") runId: string) { return this.scoring.recalculate(user, runId); }
  @Post("scoring/runs/:runId/verify")
  @Permissions(auditPermissions.scoringRunVerify)
  verifyScoringRun(@CurrentUser() user: RequestUser, @Param("runId") runId: string, @Body() dto: Record<string, any>) { return this.scoring.transition(user, runId, "verify", dto); }
  @Post("scoring/runs/:runId/lock")
  @Permissions(auditPermissions.scoringRunLock)
  lockScoringRun(@CurrentUser() user: RequestUser, @Param("runId") runId: string, @Body() dto: Record<string, any>) { return this.scoring.transition(user, runId, "lock", dto); }
  @Post("scoring/runs/:runId/unlock")
  @Permissions(auditPermissions.scoringRunUnlock)
  unlockScoringRun(@CurrentUser() user: RequestUser, @Param("runId") runId: string, @Body() dto: Record<string, any>) { return this.scoring.transition(user, runId, "unlock", dto); }
  @Post("scoring/runs/:runId/archive")
  @Permissions(auditPermissions.scoringRunArchive)
  archiveScoringRun(@CurrentUser() user: RequestUser, @Param("runId") runId: string, @Body() dto: Record<string, any>) { return this.scoring.transition(user, runId, "archive", dto); }
  @Get("scoring")
  @Permissions(auditPermissions.scoringRegisterView)
  scoringRegisterAlias(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.scoring.register(user, query); }

  @Get("programs/:programId/scoring")
  @Permissions(auditPermissions.scoringRegisterView)
  programScoring(@CurrentUser() user: RequestUser, @Param("programId") programId: string, @Query() query: Record<string, any>) { return this.scoring.sourceScopedRegister(user, "program", programId, query); }
  @Post("programs/:programId/scoring/run")
  @Permissions(auditPermissions.scoringRunCreate)
  runProgramScoring(@CurrentUser() user: RequestUser, @Param("programId") programId: string, @Body() dto: Record<string, any>) { return this.scoring.sourceRun(user, "program", programId, dto); }
  @Get("plans/:planId/scoring")
  @Permissions(auditPermissions.scoringRegisterView)
  planScoring(@CurrentUser() user: RequestUser, @Param("planId") planId: string, @Query() query: Record<string, any>) { return this.scoring.sourceScopedRegister(user, "plan", planId, query); }
  @Post("plans/:planId/scoring/run")
  @Permissions(auditPermissions.scoringRunCreate)
  runPlanScoring(@CurrentUser() user: RequestUser, @Param("planId") planId: string, @Body() dto: Record<string, any>) { return this.scoring.sourceRun(user, "plan", planId, dto); }
  @Get("execution/:executionId/scoring")
  @Permissions(auditPermissions.scoringRegisterView)
  executionScoring(@CurrentUser() user: RequestUser, @Param("executionId") executionId: string, @Query() query: Record<string, any>) { return this.scoring.sourceScopedRegister(user, "execution", executionId, query); }
  @Post("execution/:executionId/scoring/run")
  @Permissions(auditPermissions.scoringRunCreate)
  runExecutionScoring(@CurrentUser() user: RequestUser, @Param("executionId") executionId: string, @Body() dto: Record<string, any>) { return this.scoring.sourceRun(user, "execution", executionId, dto); }
  @Get("checklists/templates/:checklistId/scoring")
  @Permissions(auditPermissions.scoringRegisterView)
  checklistScoring(@CurrentUser() user: RequestUser, @Param("checklistId") checklistId: string, @Query() query: Record<string, any>) { return this.scoring.sourceScopedRegister(user, "checklist", checklistId, query); }
  @Get("findings/:findingId/scoring-impact")
  @Permissions(auditPermissions.scoringExplainabilityView)
  findingScoringImpact(@CurrentUser() user: RequestUser, @Param("findingId") findingId: string) { return this.scoring.scoringImpact(user, "finding", findingId); }
  @Get("capa/:capaId/scoring-impact")
  @Permissions(auditPermissions.scoringExplainabilityView)
  capaScoringImpact(@CurrentUser() user: RequestUser, @Param("capaId") capaId: string) { return this.scoring.scoringImpact(user, "capa", capaId); }
  @Get("evidence/:evidenceId/scoring-impact")
  @Permissions(auditPermissions.scoringExplainabilityView)
  evidenceScoringImpact(@CurrentUser() user: RequestUser, @Param("evidenceId") evidenceId: string) { return this.scoring.scoringImpact(user, "evidence", evidenceId); }
  @Get("sites/:siteId/scoring")
  @Permissions(auditPermissions.scoringRegisterView)
  siteScoring(@CurrentUser() user: RequestUser, @Param("siteId") siteId: string, @Query() query: Record<string, any>) { return this.scoring.sourceScopedRegister(user, "site", siteId, query); }
  @Get("units/:unitId/scoring")
  @Permissions(auditPermissions.scoringRegisterView)
  unitScoring(@CurrentUser() user: RequestUser, @Param("unitId") unitId: string, @Query() query: Record<string, any>) { return this.scoring.sourceScopedRegister(user, "unit", unitId, query); }
  @Get("areas/:areaId/scoring")
  @Permissions(auditPermissions.scoringRegisterView)
  areaScoring(@CurrentUser() user: RequestUser, @Param("areaId") areaId: string, @Query() query: Record<string, any>) { return this.scoring.sourceScopedRegister(user, "area", areaId, query); }
  @Get("lookups/scoring-model-types") @Permissions(auditPermissions.scoringView) scoringModelTypes() { return this.scoring.lookups().scoringModelTypes; }
  @Get("lookups/scoring-model-statuses") @Permissions(auditPermissions.scoringView) scoringModelStatuses() { return this.scoring.lookups().scoringModelStatuses; }
  @Get("lookups/scoring-rule-types") @Permissions(auditPermissions.scoringView) scoringRuleTypes() { return this.scoring.lookups().scoringRuleTypes; }
  @Get("lookups/score-statuses") @Permissions(auditPermissions.scoringView) scoreStatuses() { return this.scoring.lookups().scoreStatuses; }
  @Get("lookups/score-readiness-statuses") @Permissions(auditPermissions.scoringView) scoreReadinessStatuses() { return this.scoring.lookups().scoreReadinessStatuses; }
  @Get("lookups/score-stale-statuses") @Permissions(auditPermissions.scoringView) scoreStaleStatuses() { return this.scoring.lookups().scoreStaleStatuses; }
  @Get("lookups/score-grades") @Permissions(auditPermissions.scoringView) scoreGrades() { return this.scoring.lookups().scoreGrades; }
  @Get("lookups/score-adjustment-types") @Permissions(auditPermissions.scoringView) scoreAdjustmentTypes() { return this.scoring.lookups().scoreAdjustmentTypes; }

  @Get("evidence/dashboard")
  @Permissions(auditPermissions.evidenceDashboardView)
  evidenceDashboard(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.evidence.dashboard(user, query); }
  @Get("evidence/dashboard/summary")
  @Permissions(auditPermissions.evidenceDashboardView)
  async evidenceDashboardSummary(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return (await this.evidence.dashboard(user, query)).summary; }
  @Get("evidence/dashboard/by-site")
  @Permissions(auditPermissions.evidenceDashboardView)
  async evidenceDashboardBySite(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return (await this.evidence.dashboard(user, query)).bySite; }
  @Get("evidence/dashboard/by-source-module")
  @Permissions(auditPermissions.evidenceDashboardView)
  async evidenceDashboardBySource(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return (await this.evidence.dashboard(user, query)).bySourceModule; }
  @Get("evidence/dashboard/missing")
  @Permissions(auditPermissions.evidenceDashboardView)
  async evidenceDashboardMissing(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return (await this.evidence.dashboard(user, query)).missing; }
  @Get("evidence/dashboard/pending-review")
  @Permissions(auditPermissions.evidenceDashboardView)
  async evidenceDashboardPendingReview(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return (await this.evidence.dashboard(user, query)).pendingReview; }
  @Get("evidence/dashboard/restricted")
  @Permissions(auditPermissions.evidenceDashboardView)
  async evidenceDashboardRestricted(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return (await this.evidence.dashboard(user, query)).restricted; }
  @Get("evidence/dashboard/recent")
  @Permissions(auditPermissions.evidenceDashboardView)
  async evidenceDashboardRecent(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return (await this.evidence.dashboard(user, query)).recent; }

  @Get("evidence/context")
  @Permissions(auditPermissions.evidenceView)
  evidenceContext(@CurrentUser() user: RequestUser) { return this.evidence.context(user); }
  @Get("evidence/settings")
  @Permissions(auditPermissions.evidenceSettingsView)
  evidenceSettings(@CurrentUser() user: RequestUser, @Query("siteId") siteId?: string) { return this.evidence.settings(user, siteId ?? null); }
  @Patch("evidence/settings")
  @Permissions(auditPermissions.evidenceSettingsEdit)
  patchEvidenceSettings(@CurrentUser() user: RequestUser, @Body() dto: Record<string, any>) { return this.evidence.updateSettings(user, dto); }
  @Get("evidence/history")
  @Permissions(auditPermissions.evidenceHistoryView)
  evidenceHistory(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.evidence.globalHistory(user, query); }
  @Get("evidence/access-log")
  @Permissions(auditPermissions.evidenceAccessLogView)
  evidenceAccessLog(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.evidence.accessLog(user, query); }

  @Get("evidence/register")
  @Permissions(auditPermissions.evidenceRegisterView)
  evidenceRegister(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.evidence.register(user, query); }
  @Get("evidence/summary")
  @Permissions(auditPermissions.evidenceRegisterView)
  async evidenceSummary(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return (await this.evidence.register(user, { ...query, page: 1, limit: 1000 })).summary; }
  @Get("evidence/pending-review") @Permissions(auditPermissions.evidenceRegisterView) pendingReviewEvidence(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.evidence.register(user, { ...query, pendingReview: true }); }
  @Get("evidence/rejected") @Permissions(auditPermissions.evidenceRegisterView) rejectedEvidence(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.evidence.register(user, { ...query, rejected: true }); }
  @Get("evidence/rework-required") @Permissions(auditPermissions.evidenceRegisterView) reworkEvidence(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.evidence.register(user, { ...query, reworkRequired: true }); }
  @Get("evidence/verified") @Permissions(auditPermissions.evidenceRegisterView) verifiedEvidence(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.evidence.register(user, { ...query, verified: true }); }
  @Get("evidence/restricted") @Permissions(auditPermissions.evidenceViewRestricted) restrictedEvidence(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.evidence.register(user, { ...query, restricted: true }); }

  @Get("evidence/requirements")
  @Permissions(auditPermissions.evidenceRequirementView)
  evidenceRequirements(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.evidence.requirements(user, query); }
  @Post("evidence/requirements")
  @Permissions(auditPermissions.evidenceRequirementCreate)
  createEvidenceRequirement(@CurrentUser() user: RequestUser, @Body() dto: Record<string, any>) { return this.evidence.saveRequirement(user, dto); }
  @Get("evidence/requirements/:requirementId")
  @Permissions(auditPermissions.evidenceRequirementView)
  getEvidenceRequirement(@CurrentUser() user: RequestUser, @Param("requirementId") requirementId: string) { return this.evidence.requirements(user, { requirementId }); }
  @Patch("evidence/requirements/:requirementId")
  @Permissions(auditPermissions.evidenceRequirementEdit)
  patchEvidenceRequirement(@CurrentUser() user: RequestUser, @Param("requirementId") requirementId: string, @Body() dto: Record<string, any>) { return this.evidence.saveRequirement(user, dto, requirementId); }
  @Post("evidence/requirements/:requirementId/waive")
  @Permissions(auditPermissions.evidenceRequirementWaive)
  waiveEvidenceRequirement(@CurrentUser() user: RequestUser, @Param("requirementId") requirementId: string, @Body() dto: Record<string, any>) { return this.evidence.waiveRequirement(user, requirementId, dto); }
  @Post("evidence/requirements/:requirementId/calculate-status")
  @Permissions(auditPermissions.evidenceRequirementEdit)
  calculateEvidenceRequirement(@CurrentUser() user: RequestUser, @Param("requirementId") requirementId: string) { return this.evidence.requirements(user, { requirementId }); }

  @Get("evidence/requests")
  @Permissions(auditPermissions.evidenceRequestView)
  evidenceRequests(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.evidence.requests(user, query); }
  @Post("evidence/requests")
  @Permissions(auditPermissions.evidenceRequestCreate)
  createEvidenceRequest(@CurrentUser() user: RequestUser, @Body() dto: Record<string, any>) { return this.evidence.saveRequest(user, dto); }
  @Get("evidence/requests/:requestId")
  @Permissions(auditPermissions.evidenceRequestView)
  getEvidenceRequest(@CurrentUser() user: RequestUser, @Param("requestId") requestId: string) { return this.evidence.requests(user, { requestId }); }
  @Patch("evidence/requests/:requestId")
  @Permissions(auditPermissions.evidenceRequestCreate)
  patchEvidenceRequest(@CurrentUser() user: RequestUser, @Param("requestId") requestId: string, @Body() dto: Record<string, any>) { return this.evidence.saveRequest(user, dto, requestId); }
  @Post("evidence/requests/:requestId/send")
  @Permissions(auditPermissions.evidenceRequestSend)
  sendEvidenceRequest(@CurrentUser() user: RequestUser, @Param("requestId") requestId: string, @Body() dto: Record<string, any>) { return this.evidence.requestTransition(user, requestId, "send", dto); }
  @Post("evidence/requests/:requestId/acknowledge")
  @Permissions(auditPermissions.evidenceRequestSubmit)
  acknowledgeEvidenceRequest(@CurrentUser() user: RequestUser, @Param("requestId") requestId: string, @Body() dto: Record<string, any>) { return this.evidence.requestTransition(user, requestId, "acknowledge", dto); }
  @Post("evidence/requests/:requestId/submit-evidence")
  @Permissions(auditPermissions.evidenceRequestSubmit)
  submitEvidenceRequest(@CurrentUser() user: RequestUser, @Param("requestId") requestId: string, @Body() dto: Record<string, any>) { return this.evidence.submitRequestEvidence(user, requestId, dto); }
  @Post("evidence/requests/:requestId/cancel")
  @Permissions(auditPermissions.evidenceRequestCancel)
  cancelEvidenceRequest(@CurrentUser() user: RequestUser, @Param("requestId") requestId: string, @Body() dto: Record<string, any>) { return this.evidence.requestTransition(user, requestId, "cancel", dto); }
  @Post("evidence/requests/:requestId/reopen")
  @Permissions(auditPermissions.evidenceRequestCreate)
  reopenEvidenceRequest(@CurrentUser() user: RequestUser, @Param("requestId") requestId: string, @Body() dto: Record<string, any>) { return this.evidence.requestTransition(user, requestId, "reopen", dto); }

  @Get("evidence/gaps")
  @Permissions(auditPermissions.evidenceGapView)
  evidenceGaps(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.evidence.gaps(user, query); }
  @Post("evidence/gaps/detect")
  @Permissions(auditPermissions.evidenceGapManage)
  detectEvidenceGaps(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.evidence.detectGaps(user, query); }
  @Post("evidence/gaps/:gapId/resolve")
  @Permissions(auditPermissions.evidenceGapManage)
  resolveEvidenceGap(@CurrentUser() user: RequestUser, @Param("gapId") gapId: string, @Body() dto: Record<string, any>) { return this.evidence.resolveGap(user, gapId, dto); }
  @Post("evidence/gaps/:gapId/create-action-foundation")
  @Permissions(auditPermissions.evidenceGapManage)
  createEvidenceGapAction(@CurrentUser() user: RequestUser, @Param("gapId") gapId: string, @Body() dto: Record<string, any>) { return this.evidence.resolveGap(user, gapId, { ...dto, resolutionNote: dto.resolutionNote ?? "Action foundation created for evidence gap." }); }

  @Get("evidence/packages")
  @Permissions(auditPermissions.evidencePackageView)
  evidencePackages(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.evidence.packages(user, query); }
  @Post("evidence/packages")
  @Permissions(auditPermissions.evidencePackagePrepare)
  createEvidencePackage(@CurrentUser() user: RequestUser, @Body() dto: Record<string, any>) { return this.evidence.savePackage(user, dto); }
  @Get("evidence/packages/:packageId")
  @Permissions(auditPermissions.evidencePackageView)
  getEvidencePackage(@CurrentUser() user: RequestUser, @Param("packageId") packageId: string, @Query() query: Record<string, any>) { return this.evidence.packages(user, { ...query, packageId }); }
  @Post("evidence/packages/:packageId/prepare-manifest")
  @Permissions(auditPermissions.evidencePackagePrepare)
  prepareEvidenceManifest(@CurrentUser() user: RequestUser, @Param("packageId") packageId: string) { return this.evidence.prepareManifest(user, packageId); }
  @Post("evidence/packages/:packageId/add-evidence")
  @Permissions(auditPermissions.evidencePackagePrepare)
  addEvidencePackageItem(@CurrentUser() user: RequestUser, @Param("packageId") packageId: string, @Body() dto: Record<string, any>) { return this.evidence.addPackageEvidence(user, packageId, dto); }

  @Get("evidence")
  @Permissions(auditPermissions.evidenceRegisterView)
  evidenceRegisterAlias(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.evidence.register(user, query); }
  @Post("evidence")
  @Permissions(auditPermissions.evidenceCreate)
  createEvidence(@CurrentUser() user: RequestUser, @Body() dto: Record<string, any>) { return this.evidence.create(user, dto); }
  @Post("evidence/upload")
  @Permissions(auditPermissions.evidenceUpload)
  uploadEvidence(@CurrentUser() user: RequestUser, @Body() dto: Record<string, any>) { return this.evidence.create(user, { ...dto, sourceMode: "Upload file", evidenceType: dto.evidenceType ?? "Storage File" }); }
  @Post("evidence/link-document")
  @Permissions(auditPermissions.evidenceLinkDocument)
  linkEvidenceDocument(@CurrentUser() user: RequestUser, @Body() dto: Record<string, any>) { return this.evidence.create(user, { ...dto, sourceMode: "Link existing Document Control document", evidenceType: dto.evidenceType ?? "Document Control" }); }
  @Post("evidence/link-module-record")
  @Permissions(auditPermissions.evidenceLinkModuleRecord)
  linkEvidenceModule(@CurrentUser() user: RequestUser, @Body() dto: Record<string, any>) { return this.evidence.create(user, { ...dto, sourceMode: "Link existing PSM module record", evidenceType: dto.evidenceType ?? "Module Record" }); }
  @Get("evidence/:evidenceId")
  @Permissions(auditPermissions.evidenceView)
  evidenceDetail(@CurrentUser() user: RequestUser, @Param("evidenceId") evidenceId: string) { return this.evidence.detail(user, evidenceId); }
  @Patch("evidence/:evidenceId")
  @Permissions(auditPermissions.evidenceEdit)
  patchEvidence(@CurrentUser() user: RequestUser, @Param("evidenceId") evidenceId: string, @Body() dto: Record<string, any>) { return this.evidence.update(user, evidenceId, dto); }
  @Post("evidence/:evidenceId/replace") @Permissions(auditPermissions.evidenceReplace) replaceEvidence(@CurrentUser() user: RequestUser, @Param("evidenceId") evidenceId: string, @Body() dto: Record<string, any>) { return this.evidence.transition(user, evidenceId, "replace", dto); }
  @Post("evidence/:evidenceId/remove") @Permissions(auditPermissions.evidenceRemove) removeEvidence(@CurrentUser() user: RequestUser, @Param("evidenceId") evidenceId: string, @Body() dto: Record<string, any>) { return this.evidence.transition(user, evidenceId, "remove", dto); }
  @Post("evidence/:evidenceId/archive") @Permissions(auditPermissions.evidenceRemove) archiveEvidence(@CurrentUser() user: RequestUser, @Param("evidenceId") evidenceId: string, @Body() dto: Record<string, any>) { return this.evidence.transition(user, evidenceId, "archive", dto); }
  @Get("evidence/:evidenceId/preview") @Permissions(auditPermissions.evidencePreview) previewEvidence(@CurrentUser() user: RequestUser, @Param("evidenceId") evidenceId: string) { return this.evidence.access(user, evidenceId, "Preview"); }
  @Get("evidence/:evidenceId/download") @Permissions(auditPermissions.evidenceDownload) downloadEvidence(@CurrentUser() user: RequestUser, @Param("evidenceId") evidenceId: string) { return this.evidence.access(user, evidenceId, "Download"); }
  @Get("evidence/:evidenceId/links") @Permissions(auditPermissions.evidenceView) evidenceLinks(@CurrentUser() user: RequestUser, @Param("evidenceId") evidenceId: string) { return this.evidence.links(user, evidenceId); }
  @Post("evidence/:evidenceId/links") @Permissions(auditPermissions.evidenceEdit) addEvidenceLink(@CurrentUser() user: RequestUser, @Param("evidenceId") evidenceId: string, @Body() dto: Record<string, any>) { return this.evidence.addLink(user, evidenceId, dto); }
  @Delete("evidence/:evidenceId/links/:linkId") @Permissions(auditPermissions.evidenceEdit) removeEvidenceLink(@CurrentUser() user: RequestUser, @Param("evidenceId") evidenceId: string, @Param("linkId") linkId: string, @Body() dto: Record<string, any>) { return this.evidence.removeLink(user, evidenceId, linkId, dto); }
  @Get("evidence/:evidenceId/review") @Permissions(auditPermissions.evidenceReviewView) evidenceReview(@CurrentUser() user: RequestUser, @Param("evidenceId") evidenceId: string) { return this.evidence.detail(user, evidenceId); }
  @Post("evidence/:evidenceId/submit-review") @Permissions(auditPermissions.evidenceReviewPerform) submitEvidenceReview(@CurrentUser() user: RequestUser, @Param("evidenceId") evidenceId: string, @Body() dto: Record<string, any>) { return this.evidence.transition(user, evidenceId, "submit-review", dto); }
  @Post("evidence/:evidenceId/verify") @Permissions(auditPermissions.evidenceVerify) verifyEvidence(@CurrentUser() user: RequestUser, @Param("evidenceId") evidenceId: string, @Body() dto: Record<string, any>) { return this.evidence.review(user, evidenceId, "Verify", dto); }
  @Post("evidence/:evidenceId/reject") @Permissions(auditPermissions.evidenceReject) rejectEvidence(@CurrentUser() user: RequestUser, @Param("evidenceId") evidenceId: string, @Body() dto: Record<string, any>) { return this.evidence.review(user, evidenceId, "Reject", dto); }
  @Post("evidence/:evidenceId/request-rework") @Permissions(auditPermissions.evidenceRequestRework) reworkAuditEvidence(@CurrentUser() user: RequestUser, @Param("evidenceId") evidenceId: string, @Body() dto: Record<string, any>) { return this.evidence.review(user, evidenceId, "Request Rework", dto); }
  @Post("evidence/:evidenceId/mark-restricted") @Permissions(auditPermissions.evidenceManageRestricted) markEvidenceRestricted(@CurrentUser() user: RequestUser, @Param("evidenceId") evidenceId: string, @Body() dto: Record<string, any>) { return this.evidence.transition(user, evidenceId, "mark-restricted", dto); }
  @Post("evidence/:evidenceId/mark-superseded") @Permissions(auditPermissions.evidenceEdit) markEvidenceSuperseded(@CurrentUser() user: RequestUser, @Param("evidenceId") evidenceId: string, @Body() dto: Record<string, any>) { return this.evidence.transition(user, evidenceId, "mark-superseded", dto); }
  @Post("evidence/:evidenceId/mark-stale") @Permissions(auditPermissions.evidenceEdit) markEvidenceStale(@CurrentUser() user: RequestUser, @Param("evidenceId") evidenceId: string, @Body() dto: Record<string, any>) { return this.evidence.transition(user, evidenceId, "mark-stale", dto); }
  @Get("evidence/:evidenceId/chain-of-custody") @Permissions(auditPermissions.evidenceChainOfCustodyView) evidenceCustody(@CurrentUser() user: RequestUser, @Param("evidenceId") evidenceId: string) { return this.evidence.detail(user, evidenceId); }
  @Get("evidence/:evidenceId/access") @Permissions(auditPermissions.evidenceAccessLogView) evidenceAccess(@CurrentUser() user: RequestUser, @Param("evidenceId") evidenceId: string) { return this.evidence.detail(user, evidenceId); }
  @Get("evidence/:evidenceId/history") @Permissions(auditPermissions.evidenceHistoryView) oneEvidenceHistory(@CurrentUser() user: RequestUser, @Param("evidenceId") evidenceId: string) { return this.evidence.detail(user, evidenceId); }

  @Get("programs/:programId/evidence") @Permissions(auditPermissions.evidenceRegisterView) programEvidence(@CurrentUser() user: RequestUser, @Param("programId") programId: string, @Query() query: Record<string, any>) { return this.evidence.sourceScopedRegister(user, "program", programId, query); }
  @Get("plans/:planId/evidence") @Permissions(auditPermissions.evidenceRegisterView) planEvidence(@CurrentUser() user: RequestUser, @Param("planId") planId: string, @Query() query: Record<string, any>) { return this.evidence.sourceScopedRegister(user, "plan", planId, query); }
  @Get("checklists/templates/:checklistId/evidence") @Permissions(auditPermissions.evidenceRegisterView) checklistEvidence(@CurrentUser() user: RequestUser, @Param("checklistId") checklistId: string, @Query() query: Record<string, any>) { return this.evidence.sourceScopedRegister(user, "checklist", checklistId, query); }
  @Get("execution/:executionId/evidence") @Permissions(auditPermissions.evidenceRegisterView) executionEvidenceView(@CurrentUser() user: RequestUser, @Param("executionId") executionId: string, @Query() query: Record<string, any>) { return this.evidence.sourceScopedRegister(user, "execution", executionId, query); }
  @Get("execution/:executionId/responses/:responseId/evidence") @Permissions(auditPermissions.evidenceRegisterView) responseEvidence(@CurrentUser() user: RequestUser, @Param("responseId") responseId: string, @Query() query: Record<string, any>) { return this.evidence.sourceScopedRegister(user, "response", responseId, query); }
  @Get("findings/:findingId/evidence") @Permissions(auditPermissions.evidenceRegisterView) findingEvidenceView(@CurrentUser() user: RequestUser, @Param("findingId") findingId: string, @Query() query: Record<string, any>) { return this.evidence.sourceScopedRegister(user, "finding", findingId, query); }
  @Get("capa/:capaId/evidence") @Permissions(auditPermissions.evidenceRegisterView) capaEvidenceView(@CurrentUser() user: RequestUser, @Param("capaId") capaId: string, @Query() query: Record<string, any>) { return this.evidence.sourceScopedRegister(user, "capa", capaId, query); }
  @Get("capa/:capaId/actions/:actionId/evidence") @Permissions(auditPermissions.evidenceRegisterView) capaActionEvidenceView(@CurrentUser() user: RequestUser, @Param("actionId") actionId: string, @Query() query: Record<string, any>) { return this.evidence.sourceScopedRegister(user, "capaAction", actionId, query); }
  @Get("sites/:siteId/evidence") @Permissions(auditPermissions.evidenceRegisterView) siteEvidence(@CurrentUser() user: RequestUser, @Param("siteId") siteId: string, @Query() query: Record<string, any>) { return this.evidence.sourceScopedRegister(user, "site", siteId, query); }
  @Get("units/:unitId/evidence") @Permissions(auditPermissions.evidenceRegisterView) unitEvidence(@CurrentUser() user: RequestUser, @Param("unitId") unitId: string, @Query() query: Record<string, any>) { return this.evidence.sourceScopedRegister(user, "unit", unitId, query); }
  @Get("areas/:areaId/evidence") @Permissions(auditPermissions.evidenceRegisterView) areaEvidence(@CurrentUser() user: RequestUser, @Param("areaId") areaId: string, @Query() query: Record<string, any>) { return this.evidence.sourceScopedRegister(user, "area", areaId, query); }

  @Get("lookups/evidence-statuses") @Permissions(auditPermissions.evidenceView) evidenceStatuses() { return this.evidence.lookups().evidenceStatuses; }
  @Get("lookups/evidence-types") @Permissions(auditPermissions.evidenceView) evidenceTypes() { return this.evidence.lookups().evidenceTypes; }
  @Get("lookups/evidence-source-modes") @Permissions(auditPermissions.evidenceView) evidenceSourceModes() { return this.evidence.lookups().evidenceSourceModes; }
  @Get("lookups/evidence-review-statuses") @Permissions(auditPermissions.evidenceView) evidenceReviewStatuses() { return this.evidence.lookups().evidenceReviewStatuses; }
  @Get("lookups/evidence-requirement-statuses") @Permissions(auditPermissions.evidenceView) evidenceRequirementStatuses() { return this.evidence.lookups().evidenceRequirementStatuses; }
  @Get("lookups/evidence-request-statuses") @Permissions(auditPermissions.evidenceView) evidenceRequestStatuses() { return this.evidence.lookups().evidenceRequestStatuses; }
  @Get("lookups/evidence-readiness-statuses") @Permissions(auditPermissions.evidenceView) evidenceReadinessStatuses() { return this.evidence.lookups().evidenceReadinessStatuses; }
  @Get("lookups/evidence-access-statuses") @Permissions(auditPermissions.evidenceView) evidenceAccessStatuses() { return this.evidence.lookups().evidenceAccessStatuses; }
  @Get("lookups/evidence-confidentiality-levels") @Permissions(auditPermissions.evidenceView) evidenceConfidentialityLevels() { return this.evidence.lookups().evidenceConfidentialityLevels; }
  @Get("lookups/evidence-verification-methods") @Permissions(auditPermissions.evidenceView) evidenceVerificationMethods() { return this.evidence.lookups().evidenceVerificationMethods; }

  @Get("capa/dashboard")
  @Permissions(auditPermissions.capaDashboardView)
  capaDashboard(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.capa.dashboard(user, query);
  }
  @Get("capa/dashboard/summary")
  @Permissions(auditPermissions.capaDashboardView)
  async capaDashboardSummary(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return (await this.capa.dashboard(user, query)).summary;
  }
  @Get("capa/dashboard/by-site")
  @Permissions(auditPermissions.capaDashboardView)
  async capaDashboardBySite(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return (await this.capa.dashboard(user, query)).bySite;
  }
  @Get("capa/dashboard/by-owner")
  @Permissions(auditPermissions.capaDashboardView)
  async capaDashboardByOwner(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return (await this.capa.dashboard(user, query)).byOwner;
  }
  @Get("capa/dashboard/overdue")
  @Permissions(auditPermissions.capaDashboardView)
  async capaDashboardOverdue(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return (await this.capa.dashboard(user, query)).overdue;
  }
  @Get("capa/dashboard/pending-verification")
  @Permissions(auditPermissions.capaDashboardView)
  async capaDashboardPendingVerification(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return (await this.capa.dashboard(user, query)).pendingVerification;
  }
  @Get("capa/dashboard/effectiveness-pending")
  @Permissions(auditPermissions.capaDashboardView)
  async capaDashboardEffectivenessPending(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return (await this.capa.dashboard(user, query)).effectivenessPending;
  }
  @Get("capa/dashboard/ready-for-closure")
  @Permissions(auditPermissions.capaDashboardView)
  async capaDashboardReadyClosure(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return (await this.capa.dashboard(user, query)).readyForClosure;
  }
  @Get("capa/dashboard/recent")
  @Permissions(auditPermissions.capaDashboardView)
  async capaDashboardRecent(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return (await this.capa.dashboard(user, query)).recent;
  }
  @Get("capa/context")
  @Permissions(auditPermissions.capaView)
  capaContext(@CurrentUser() user: RequestUser) {
    return this.capa.context(user);
  }
  @Get("capa/settings")
  @Permissions(auditPermissions.capaSettingsView)
  capaSettings(@CurrentUser() user: RequestUser, @Query("siteId") siteId?: string) {
    return this.capa.settings(user, siteId ?? null);
  }
  @Patch("capa/settings")
  @Permissions(auditPermissions.capaSettingsEdit)
  patchCapaSettings(@CurrentUser() user: RequestUser, @Body() dto: Record<string, any>) {
    return this.capa.updateSettings(user, dto);
  }
  @Get("capa/history")
  @Permissions(auditPermissions.capaHistoryView)
  capaHistory(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.capa.globalHistory(user, query);
  }
  @Get("capa/register")
  @Permissions(auditPermissions.capaRegisterView)
  capaRegister(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.capa.register(user, query);
  }
  @Get("capa/summary")
  @Permissions(auditPermissions.capaRegisterView)
  async capaSummary(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return (await this.capa.register(user, { ...query, page: 1, limit: 1000 })).summary;
  }
  @Get("capa/open") @Permissions(auditPermissions.capaRegisterView) openCapa(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.capa.register(user, { ...query, status: "Open" }); }
  @Get("capa/draft") @Permissions(auditPermissions.capaRegisterView) draftCapa(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.capa.register(user, { ...query, status: "Draft" }); }
  @Get("capa/pending-assignment") @Permissions(auditPermissions.capaRegisterView) pendingAssignmentCapa(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.capa.register(user, { ...query, status: "Pending Assignment" }); }
  @Get("capa/in-progress") @Permissions(auditPermissions.capaRegisterView) inProgressCapa(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.capa.register(user, { ...query, status: "In Progress" }); }
  @Get("capa/overdue") @Permissions(auditPermissions.capaRegisterView) overdueCapa(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.capa.register(user, { ...query, overdue: true }); }
  @Get("capa/completed") @Permissions(auditPermissions.capaRegisterView) completedCapa(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.capa.register(user, { ...query, status: "Completed" }); }
  @Get("capa/pending-verification") @Permissions(auditPermissions.capaRegisterView) pendingVerificationCapa(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.capa.register(user, { ...query, verificationStatus: "Pending Verification" }); }
  @Get("capa/verification-failed") @Permissions(auditPermissions.capaRegisterView) verificationFailedCapa(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.capa.register(user, { ...query, status: "Verification Failed" }); }
  @Get("capa/effectiveness-pending") @Permissions(auditPermissions.capaRegisterView) effectivenessPendingCapa(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.capa.register(user, { ...query, effectivenessStatus: "Pending" }); }
  @Get("capa/ineffective") @Permissions(auditPermissions.capaRegisterView) ineffectiveCapa(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.capa.register(user, { ...query, effectivenessStatus: "Ineffective" }); }
  @Get("capa/ready-for-closure") @Permissions(auditPermissions.capaRegisterView) readyClosureCapa(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.capa.register(user, { ...query, closureReadinessStatus: "Ready For Closure" }); }
  @Get("capa/closed") @Permissions(auditPermissions.capaRegisterView) closedCapa(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.capa.register(user, { ...query, status: "Closed" }); }
  @Get("capa/reopened") @Permissions(auditPermissions.capaRegisterView) reopenedCapa(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.capa.register(user, { ...query, status: "Reopened" }); }
  @Get("capa/safety-critical") @Permissions(auditPermissions.capaRegisterView) safetyCriticalCapa(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.capa.register(user, { ...query, safetyCritical: true }); }
  @Get("capa/regulatory-critical") @Permissions(auditPermissions.capaRegisterView) regulatoryCriticalCapa(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.capa.register(user, { ...query, regulatoryCritical: true }); }
  @Get("capa/repeat-findings") @Permissions(auditPermissions.capaRegisterView) repeatFindingCapa(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) { return this.capa.register(user, { ...query, repeatFindings: true }); }
  @Get("capa/action-sync-events")
  @Permissions(auditPermissions.capaSyncActionEngine)
  capaActionSyncEvents(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.capa.globalHistory(user, { ...query, syncOnly: true });
  }
  @Post("capa/action-engine-callback")
  @Permissions(auditPermissions.capaSyncActionEngine)
  capaActionEngineCallback(@CurrentUser() user: RequestUser, @Body() dto: Record<string, any>) {
    return this.capa.globalHistory(user, dto);
  }
  @Get("capa")
  @Permissions(auditPermissions.capaRegisterView)
  capaRegisterAlias(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.capa.register(user, query);
  }
  @Post("capa")
  @Permissions(auditPermissions.capaCreate)
  createCapa(@CurrentUser() user: RequestUser, @Body() dto: Record<string, any>) {
    return this.capa.create(user, dto);
  }
  @Get("findings/:findingId/capa")
  @Permissions(auditPermissions.capaView)
  findingCapa(@CurrentUser() user: RequestUser, @Param("findingId") findingId: string) {
    return this.capa.findingCapa(user, findingId);
  }
  @Post("findings/:findingId/create-capa")
  @Permissions(auditPermissions.capaCreateFromFinding)
  createCapaFromFinding(@CurrentUser() user: RequestUser, @Param("findingId") findingId: string, @Body() dto: Record<string, any>) {
    return this.capa.createFromFinding(user, findingId, dto);
  }
  @Get("findings/:findingId/actions")
  @Permissions(auditPermissions.capaActionView)
  findingCapaActions(@CurrentUser() user: RequestUser, @Param("findingId") findingId: string) {
    return this.capa.findingActions(user, findingId);
  }
  @Get("findings/:findingId/closure-readiness")
  @Permissions(auditPermissions.capaView)
  findingClosureReadiness(@CurrentUser() user: RequestUser, @Param("findingId") findingId: string) {
    return this.capa.findingClosureReadiness(user, findingId);
  }
  @Post("findings/:findingId/run-closure-readiness")
  @Permissions(auditPermissions.capaClosureReadinessRun)
  runFindingClosureReadiness(@CurrentUser() user: RequestUser, @Param("findingId") findingId: string) {
    return this.capa.findingClosureReadiness(user, findingId);
  }
  @Get("capa/:capaId")
  @Permissions(auditPermissions.capaView)
  capaDetail(@CurrentUser() user: RequestUser, @Param("capaId") capaId: string) {
    return this.capa.detail(user, capaId);
  }
  @Patch("capa/:capaId")
  @Permissions(auditPermissions.capaEdit)
  patchCapa(@CurrentUser() user: RequestUser, @Param("capaId") capaId: string, @Body() dto: Record<string, any>) {
    return this.capa.update(user, capaId, dto);
  }
  @Post("capa/:capaId/open") @Permissions(auditPermissions.capaOpen) openOneCapa(@CurrentUser() user: RequestUser, @Param("capaId") capaId: string, @Body() dto: Record<string, any>) { return this.capa.transition(user, capaId, "open", dto); }
  @Post("capa/:capaId/close") @Permissions(auditPermissions.capaClose) closeOneCapa(@CurrentUser() user: RequestUser, @Param("capaId") capaId: string, @Body() dto: Record<string, any>) { return this.capa.transition(user, capaId, "close", dto); }
  @Post("capa/:capaId/reopen") @Permissions(auditPermissions.capaReopen) reopenOneCapa(@CurrentUser() user: RequestUser, @Param("capaId") capaId: string, @Body() dto: Record<string, any>) { return this.capa.transition(user, capaId, "reopen", dto); }
  @Post("capa/:capaId/archive") @Permissions(auditPermissions.capaArchive) archiveOneCapa(@CurrentUser() user: RequestUser, @Param("capaId") capaId: string, @Body() dto: Record<string, any>) { return this.capa.transition(user, capaId, "archive", dto); }
  @Post("capa/:capaId/run-closure-readiness") @Permissions(auditPermissions.capaClosureReadinessRun) runCapaClosureReadiness(@CurrentUser() user: RequestUser, @Param("capaId") capaId: string) { return this.capa.runClosureReadiness(user, capaId); }
  @Get("capa/:capaId/history") @Permissions(auditPermissions.capaHistoryView) oneCapaHistory(@CurrentUser() user: RequestUser, @Param("capaId") capaId: string) { return this.capa.rows(user, capaId, "history"); }
  @Get("capa/:capaId/:section(findings|actions|containment|evidence|verification|effectiveness|closure-readiness)")
  @Permissions(auditPermissions.capaView)
  capaSection(@CurrentUser() user: RequestUser, @Param("capaId") capaId: string, @Param("section") section: string) {
    return this.capa.rows(user, capaId, section);
  }
  @Post("capa/:capaId/:section(findings|actions|containment|evidence|verification|effectiveness)")
  @Permissions(auditPermissions.capaEdit)
  addCapaSection(@CurrentUser() user: RequestUser, @Param("capaId") capaId: string, @Param("section") section: string, @Body() dto: Record<string, any>) {
    return this.capa.addRow(user, capaId, section, dto);
  }
  @Patch("capa/:capaId/:section(actions|containment|evidence|verification|effectiveness)/:rowId")
  @Permissions(auditPermissions.capaEdit)
  patchCapaSection(@CurrentUser() user: RequestUser, @Param("capaId") capaId: string, @Param("section") section: string, @Param("rowId") rowId: string, @Body() dto: Record<string, any>) {
    return this.capa.patchRow(user, capaId, section, rowId, dto);
  }
  @Delete("capa/:capaId/:section(findings|actions|evidence)/:rowId")
  @Permissions(auditPermissions.capaEdit)
  removeCapaSection(@CurrentUser() user: RequestUser, @Param("capaId") capaId: string, @Param("section") section: string, @Param("rowId") rowId: string, @Body() dto: Record<string, any>) {
    return this.capa.removeRow(user, capaId, section, rowId, dto);
  }
  @Get("capa/:capaId/actions/:capaActionId") @Permissions(auditPermissions.capaActionView) capaActionDetail(@CurrentUser() user: RequestUser, @Param("capaId") capaId: string) { return this.capa.rows(user, capaId, "actions"); }
  @Post("capa/:capaId/actions/:capaActionId/assign") @Permissions(auditPermissions.capaActionAssign) assignCapaAction(@CurrentUser() user: RequestUser, @Param("capaId") capaId: string, @Param("capaActionId") capaActionId: string, @Body() dto: Record<string, any>) { return this.capa.actionLifecycle(user, capaId, capaActionId, "assign", dto); }
  @Post("capa/:capaId/actions/:capaActionId/complete") @Permissions(auditPermissions.capaActionComplete) completeCapaAction(@CurrentUser() user: RequestUser, @Param("capaId") capaId: string, @Param("capaActionId") capaActionId: string, @Body() dto: Record<string, any>) { return this.capa.actionLifecycle(user, capaId, capaActionId, "complete", dto); }
  @Post("capa/:capaId/actions/:capaActionId/verify") @Permissions(auditPermissions.capaActionVerify) verifyCapaAction(@CurrentUser() user: RequestUser, @Param("capaId") capaId: string, @Param("capaActionId") capaActionId: string, @Body() dto: Record<string, any>) { return this.capa.actionLifecycle(user, capaId, capaActionId, "verify", dto); }
  @Post("capa/:capaId/actions/:capaActionId/reject") @Permissions(auditPermissions.capaActionReject) rejectCapaAction(@CurrentUser() user: RequestUser, @Param("capaId") capaId: string, @Param("capaActionId") capaActionId: string, @Body() dto: Record<string, any>) { return this.capa.actionLifecycle(user, capaId, capaActionId, "reject", dto); }
  @Post("capa/:capaId/actions/:capaActionId/reopen") @Permissions(auditPermissions.capaActionReopen) reopenCapaAction(@CurrentUser() user: RequestUser, @Param("capaId") capaId: string, @Param("capaActionId") capaActionId: string, @Body() dto: Record<string, any>) { return this.capa.actionLifecycle(user, capaId, capaActionId, "reopen", dto); }
  @Post("capa/:capaId/actions/:capaActionId/cancel") @Permissions(auditPermissions.capaActionEdit) cancelCapaAction(@CurrentUser() user: RequestUser, @Param("capaId") capaId: string, @Param("capaActionId") capaActionId: string, @Body() dto: Record<string, any>) { return this.capa.actionLifecycle(user, capaId, capaActionId, "cancel", dto); }
  @Post("capa/:capaId/containment/:containmentId/complete") @Permissions(auditPermissions.capaContainmentManage) completeContainment(@CurrentUser() user: RequestUser, @Param("capaId") capaId: string, @Param("containmentId") containmentId: string, @Body() dto: Record<string, any>) { return this.capa.containmentLifecycle(user, capaId, containmentId, "complete", dto); }
  @Post("capa/:capaId/containment/:containmentId/verify") @Permissions(auditPermissions.capaContainmentManage) verifyContainment(@CurrentUser() user: RequestUser, @Param("capaId") capaId: string, @Param("containmentId") containmentId: string, @Body() dto: Record<string, any>) { return this.capa.containmentLifecycle(user, capaId, containmentId, "verify", dto); }
  @Post("capa/:capaId/effectiveness/:effectivenessId/record-result") @Permissions(auditPermissions.capaEffectivenessPerform) recordEffectiveness(@CurrentUser() user: RequestUser, @Param("capaId") capaId: string, @Param("effectivenessId") effectivenessId: string, @Body() dto: Record<string, any>) { return this.capa.recordEffectivenessResult(user, capaId, effectivenessId, dto); }
  @Post("capa/:capaId/sync-action-engine") @Permissions(auditPermissions.capaSyncActionEngine) syncCapaActionEngine(@CurrentUser() user: RequestUser, @Param("capaId") capaId: string) { return this.capa.runClosureReadiness(user, capaId); }
  @Post("capa/actions/:capaActionId/sync") @Permissions(auditPermissions.capaSyncActionEngine) syncOneCapaAction(@CurrentUser() user: RequestUser, @Param("capaActionId") capaActionId: string) { return this.capa.globalHistory(user, { capaActionId }); }
  @Get("execution/:executionId/capa") @Permissions(auditPermissions.capaRegisterView) executionCapa(@CurrentUser() user: RequestUser, @Param("executionId") executionId: string, @Query() query: Record<string, any>) { return this.capa.sourceScopedRegister(user, "execution", executionId, query); }
  @Get("plans/:planId/capa") @Permissions(auditPermissions.capaRegisterView) planCapa(@CurrentUser() user: RequestUser, @Param("planId") planId: string, @Query() query: Record<string, any>) { return this.capa.sourceScopedRegister(user, "plan", planId, query); }
  @Get("programs/:programId/capa") @Permissions(auditPermissions.capaRegisterView) programCapa(@CurrentUser() user: RequestUser, @Param("programId") programId: string, @Query() query: Record<string, any>) { return this.capa.sourceScopedRegister(user, "program", programId, query); }
  @Get("sites/:siteId/capa") @Permissions(auditPermissions.capaRegisterView) siteCapa(@CurrentUser() user: RequestUser, @Param("siteId") siteId: string, @Query() query: Record<string, any>) { return this.capa.sourceScopedRegister(user, "site", siteId, query); }
  @Get("units/:unitId/capa") @Permissions(auditPermissions.capaRegisterView) unitCapa(@CurrentUser() user: RequestUser, @Param("unitId") unitId: string, @Query() query: Record<string, any>) { return this.capa.sourceScopedRegister(user, "unit", unitId, query); }
  @Get("areas/:areaId/capa") @Permissions(auditPermissions.capaRegisterView) areaCapa(@CurrentUser() user: RequestUser, @Param("areaId") areaId: string, @Query() query: Record<string, any>) { return this.capa.sourceScopedRegister(user, "area", areaId, query); }
  @Get("lookups/capa-statuses") @Permissions(auditPermissions.capaView) capaStatuses() { return this.capa.lookups().capaStatuses; }
  @Get("lookups/capa-categories") @Permissions(auditPermissions.capaView) capaCategories() { return this.capa.lookups().capaCategories; }
  @Get("lookups/capa-action-types") @Permissions(auditPermissions.capaView) capaActionTypes() { return this.capa.lookups().capaActionTypes; }
  @Get("lookups/capa-action-statuses") @Permissions(auditPermissions.capaView) capaActionStatuses() { return this.capa.lookups().capaActionStatuses; }
  @Get("lookups/capa-verification-statuses") @Permissions(auditPermissions.capaView) capaVerificationStatuses() { return this.capa.lookups().capaVerificationStatuses; }
  @Get("lookups/capa-effectiveness-statuses") @Permissions(auditPermissions.capaView) capaEffectivenessStatuses() { return this.capa.lookups().capaEffectivenessStatuses; }
  @Get("lookups/capa-closure-readiness-statuses") @Permissions(auditPermissions.capaView) capaClosureStatuses() { return this.capa.lookups().capaClosureReadinessStatuses; }
  @Get("lookups/cause-categories") @Permissions(auditPermissions.capaView) causeCategories() { return this.capa.lookups().causeCategories; }
  @Get("lookups/verification-methods") @Permissions(auditPermissions.capaView) verificationMethods() { return this.capa.lookups().verificationMethods; }
  @Get("lookups/effectiveness-methods") @Permissions(auditPermissions.capaView) effectivenessMethods() { return this.capa.lookups().effectivenessMethods; }

  @Get("findings/dashboard")
  @Permissions(auditPermissions.findingDashboardView)
  findingDashboard(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.findings.dashboard(user, query);
  }
  @Get("findings/dashboard/summary")
  @Permissions(auditPermissions.findingDashboardView)
  async findingDashboardSummary(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return (await this.findings.dashboard(user, query)).summary;
  }
  @Get("findings/dashboard/by-site")
  @Permissions(auditPermissions.findingDashboardView)
  async findingDashboardBySite(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return (await this.findings.dashboard(user, query)).bySite;
  }
  @Get("findings/dashboard/by-module")
  @Permissions(auditPermissions.findingDashboardView)
  async findingDashboardByModule(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return (await this.findings.dashboard(user, query)).byModule;
  }
  @Get("findings/dashboard/overdue")
  @Permissions(auditPermissions.findingDashboardView)
  async findingDashboardOverdue(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return (await this.findings.dashboard(user, query)).overdue;
  }
  @Get("findings/dashboard/safety-critical")
  @Permissions(auditPermissions.findingDashboardView)
  async findingDashboardSafetyCritical(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return (await this.findings.dashboard(user, query)).safetyCritical;
  }
  @Get("findings/dashboard/ready-for-capa")
  @Permissions(auditPermissions.findingDashboardView)
  async findingDashboardReadyCapa(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return (await this.findings.dashboard(user, query)).readyForCapa;
  }
  @Get("findings/dashboard/recent")
  @Permissions(auditPermissions.findingDashboardView)
  async findingDashboardRecent(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return (await this.findings.dashboard(user, query)).recent;
  }
  @Get("findings/context")
  @Permissions(auditPermissions.findingView)
  findingContext(@CurrentUser() user: RequestUser) {
    return this.findings.context(user);
  }
  @Get("findings/settings")
  @Permissions(auditPermissions.findingSettingsView)
  findingSettings(@CurrentUser() user: RequestUser, @Query("siteId") siteId?: string) {
    return this.findings.settings(user, siteId ?? null);
  }
  @Patch("findings/settings")
  @Permissions(auditPermissions.findingSettingsEdit)
  patchFindingSettings(@CurrentUser() user: RequestUser, @Body() dto: Record<string, any>) {
    return this.findings.updateSettings(user, dto);
  }
  @Get("findings/history")
  @Permissions(auditPermissions.findingHistoryView)
  findingHistory(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.findings.register(user, query);
  }
  @Get("findings/convert-from-field")
  @Permissions(auditPermissions.findingConvertFromField)
  findingConvertOptions(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.executions.findings(user, { ...query, status: query.status ?? "Ready For Finding Register" });
  }
  @Get("findings/register")
  @Permissions(auditPermissions.findingRegisterView)
  findingRegister(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.findings.register(user, query);
  }
  @Get("findings/summary")
  @Permissions(auditPermissions.findingRegisterView)
  async findingSummary(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return (await this.findings.register(user, { ...query, page: 1, limit: 1000 })).summary;
  }
  @Get("findings/open")
  @Permissions(auditPermissions.findingRegisterView)
  openFindings(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.findings.register(user, { ...query, status: "Open" });
  }
  @Get("findings/draft")
  @Permissions(auditPermissions.findingRegisterView)
  draftFindings(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.findings.register(user, { ...query, status: "Draft" });
  }
  @Get("findings/under-review")
  @Permissions(auditPermissions.findingRegisterView)
  underReviewFindings(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.findings.register(user, { ...query, status: "Under Review" });
  }
  @Get("findings/confirmed")
  @Permissions(auditPermissions.findingRegisterView)
  confirmedFindings(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.findings.register(user, { ...query, status: "Confirmed" });
  }
  @Get("findings/rejected")
  @Permissions(auditPermissions.findingRegisterView)
  rejectedFindings(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.findings.register(user, { ...query, status: "Rejected" });
  }
  @Get("findings/needs-more-information")
  @Permissions(auditPermissions.findingRegisterView)
  needsInfoFindings(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.findings.register(user, { ...query, status: "Needs More Information" });
  }
  @Get("findings/ready-for-capa")
  @Permissions(auditPermissions.findingRegisterView)
  readyForCapaFindings(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.findings.register(user, { ...query, readyForCapa: true });
  }
  @Get("findings/awaiting-owner")
  @Permissions(auditPermissions.findingRegisterView)
  awaitingOwnerFindings(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.findings.register(user, { ...query, awaitingOwner: true });
  }
  @Get("findings/overdue")
  @Permissions(auditPermissions.findingRegisterView)
  overdueFindings(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.findings.register(user, { ...query, overdue: true });
  }
  @Get("findings/safety-critical")
  @Permissions(auditPermissions.findingRegisterView)
  safetyCriticalFindings(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.findings.register(user, { ...query, safetyCritical: true });
  }
  @Get("findings/regulatory-critical")
  @Permissions(auditPermissions.findingRegisterView)
  regulatoryCriticalFindings(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.findings.register(user, { ...query, regulatoryCritical: true });
  }
  @Get("findings/psm-critical")
  @Permissions(auditPermissions.findingRegisterView)
  psmCriticalFindings(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.findings.register(user, { ...query, psmCritical: true });
  }
  @Get("findings/repeat-findings")
  @Permissions(auditPermissions.findingRegisterView)
  repeatFindings(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.findings.register(user, { ...query, repeatFinding: true });
  }
  @Get("findings/high-priority")
  @Permissions(auditPermissions.findingRegisterView)
  highPriorityFindings(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.findings.register(user, { ...query, priority: query.priority ?? "High" });
  }
  @Get("findings/archived")
  @Permissions(auditPermissions.findingRegisterView)
  archivedFindings(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.findings.register(user, { ...query, includeArchived: true, status: "Archived" });
  }
  @Get("findings")
  @Permissions(auditPermissions.findingRegisterView)
  findingRegisterAlias(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.findings.register(user, query);
  }
  @Post("findings")
  @Permissions(auditPermissions.findingCreate)
  createFinding(@CurrentUser() user: RequestUser, @Body() dto: Record<string, any>) {
    return this.findings.create(user, dto);
  }
  @Get("findings/:findingId")
  @Permissions(auditPermissions.findingView)
  findingDetail(@CurrentUser() user: RequestUser, @Param("findingId") findingId: string) {
    return this.findings.detail(user, findingId);
  }
  @Patch("findings/:findingId")
  @Permissions(auditPermissions.findingEdit)
  patchFinding(@CurrentUser() user: RequestUser, @Param("findingId") findingId: string, @Body() dto: Record<string, any>) {
    return this.findings.update(user, findingId, dto);
  }
  @Post("findings/:findingId/confirm")
  @Permissions(auditPermissions.findingConfirm)
  confirmFinding(@CurrentUser() user: RequestUser, @Param("findingId") findingId: string, @Body() dto: Record<string, any>) {
    return this.findings.transition(user, findingId, "confirm", dto);
  }
  @Post("findings/:findingId/reject")
  @Permissions(auditPermissions.findingReject)
  rejectFinding(@CurrentUser() user: RequestUser, @Param("findingId") findingId: string, @Body() dto: Record<string, any>) {
    return this.findings.transition(user, findingId, "reject", dto);
  }
  @Post("findings/:findingId/request-more-information")
  @Permissions(auditPermissions.findingReviewPerform)
  requestMoreInfoFinding(@CurrentUser() user: RequestUser, @Param("findingId") findingId: string, @Body() dto: Record<string, any>) {
    return this.findings.transition(user, findingId, "request-more-information", dto);
  }
  @Post("findings/:findingId/mark-ready-for-capa")
  @Permissions(auditPermissions.findingCapaFoundationCreate)
  markFindingReadyForCapa(@CurrentUser() user: RequestUser, @Param("findingId") findingId: string, @Body() dto: Record<string, any>) {
    return this.findings.transition(user, findingId, "mark-ready-for-capa", dto);
  }
  @Post("findings/:findingId/reopen")
  @Permissions(auditPermissions.findingReopen)
  reopenFinding(@CurrentUser() user: RequestUser, @Param("findingId") findingId: string, @Body() dto: Record<string, any>) {
    return this.findings.transition(user, findingId, "reopen", dto);
  }
  @Post("findings/:findingId/archive")
  @Permissions(auditPermissions.findingArchive)
  archiveFinding(@CurrentUser() user: RequestUser, @Param("findingId") findingId: string, @Body() dto: Record<string, any>) {
    return this.findings.transition(user, findingId, "archive", dto);
  }
  @Post("findings/:findingId/calculate-readiness")
  @Permissions(auditPermissions.findingEdit)
  calculateFindingReadiness(@CurrentUser() user: RequestUser, @Param("findingId") findingId: string) {
    return this.findings.recalculateFinding(user, findingId);
  }
  @Post("findings/:findingId/check-duplicates")
  @Permissions(auditPermissions.findingDuplicateCheck)
  checkFindingDuplicates(@CurrentUser() user: RequestUser, @Param("findingId") findingId: string, @Body() dto: Record<string, any>) {
    return this.findings.checkDuplicates(user, findingId, dto);
  }
  @Get("findings/:findingId/source")
  @Permissions(auditPermissions.findingView)
  findingSources(@CurrentUser() user: RequestUser, @Param("findingId") findingId: string) {
    return this.findings.sectionRows(user, findingId, "source");
  }
  @Post("findings/:findingId/source")
  @Permissions(auditPermissions.findingSourceManage)
  addFindingSource(@CurrentUser() user: RequestUser, @Param("findingId") findingId: string, @Body() dto: Record<string, any>) {
    return this.findings.upsertSection(user, findingId, "source", dto);
  }
  @Delete("findings/:findingId/source/:sourceId")
  @Permissions(auditPermissions.findingSourceManage)
  removeFindingSource(@CurrentUser() user: RequestUser, @Param("findingId") findingId: string, @Param("sourceId") sourceId: string, @Body() dto: Record<string, any>) {
    return this.findings.removeSection(user, findingId, "source", sourceId, dto.reason);
  }
  @Get("findings/:findingId/standards")
  @Permissions(auditPermissions.findingView)
  findingStandards(@CurrentUser() user: RequestUser, @Param("findingId") findingId: string) {
    return this.findings.sectionRows(user, findingId, "standards");
  }
  @Post("findings/:findingId/standards")
  @Permissions(auditPermissions.findingStandardManage)
  addFindingStandard(@CurrentUser() user: RequestUser, @Param("findingId") findingId: string, @Body() dto: Record<string, any>) {
    return this.findings.upsertSection(user, findingId, "standards", dto);
  }
  @Patch("findings/:findingId/standards/:standardId")
  @Permissions(auditPermissions.findingStandardManage)
  patchFindingStandard(@CurrentUser() user: RequestUser, @Param("findingId") findingId: string, @Param("standardId") standardId: string, @Body() dto: Record<string, any>) {
    return this.findings.upsertSection(user, findingId, "standards", dto, standardId);
  }
  @Delete("findings/:findingId/standards/:standardId")
  @Permissions(auditPermissions.findingStandardManage)
  removeFindingStandard(@CurrentUser() user: RequestUser, @Param("findingId") findingId: string, @Param("standardId") standardId: string, @Body() dto: Record<string, any>) {
    return this.findings.removeSection(user, findingId, "standards", standardId, dto.reason);
  }
  @Get("findings/:findingId/modules")
  @Permissions(auditPermissions.findingView)
  findingModules(@CurrentUser() user: RequestUser, @Param("findingId") findingId: string) {
    return this.findings.sectionRows(user, findingId, "modules");
  }
  @Post("findings/:findingId/modules")
  @Permissions(auditPermissions.findingModuleManage)
  addFindingModule(@CurrentUser() user: RequestUser, @Param("findingId") findingId: string, @Body() dto: Record<string, any>) {
    return this.findings.upsertSection(user, findingId, "modules", dto);
  }
  @Patch("findings/:findingId/modules/:moduleId")
  @Permissions(auditPermissions.findingModuleManage)
  patchFindingModule(@CurrentUser() user: RequestUser, @Param("findingId") findingId: string, @Param("moduleId") moduleId: string, @Body() dto: Record<string, any>) {
    return this.findings.upsertSection(user, findingId, "modules", dto, moduleId);
  }
  @Delete("findings/:findingId/modules/:moduleId")
  @Permissions(auditPermissions.findingModuleManage)
  removeFindingModule(@CurrentUser() user: RequestUser, @Param("findingId") findingId: string, @Param("moduleId") moduleId: string, @Body() dto: Record<string, any>) {
    return this.findings.removeSection(user, findingId, "modules", moduleId, dto.reason);
  }
  @Get("findings/:findingId/evidence")
  @Permissions(auditPermissions.findingEvidenceView)
  findingEvidence(@CurrentUser() user: RequestUser, @Param("findingId") findingId: string) {
    return this.findings.sectionRows(user, findingId, "evidence");
  }
  @Post("findings/:findingId/evidence")
  @Permissions(auditPermissions.findingEvidenceAdd)
  addFindingEvidence(@CurrentUser() user: RequestUser, @Param("findingId") findingId: string, @Body() dto: Record<string, any>) {
    return this.findings.upsertSection(user, findingId, "evidence", dto);
  }
  @Patch("findings/:findingId/evidence/:evidenceId")
  @Permissions(auditPermissions.findingEvidenceAdd)
  patchFindingEvidence(@CurrentUser() user: RequestUser, @Param("findingId") findingId: string, @Param("evidenceId") evidenceId: string, @Body() dto: Record<string, any>) {
    return this.findings.upsertSection(user, findingId, "evidence", dto, evidenceId);
  }
  @Delete("findings/:findingId/evidence/:evidenceId")
  @Permissions(auditPermissions.findingEvidenceRemove)
  removeFindingEvidence(@CurrentUser() user: RequestUser, @Param("findingId") findingId: string, @Param("evidenceId") evidenceId: string, @Body() dto: Record<string, any>) {
    return this.findings.removeSection(user, findingId, "evidence", evidenceId, dto.reason);
  }
  @Get("findings/:findingId/ownership")
  @Permissions(auditPermissions.findingView)
  findingOwnership(@CurrentUser() user: RequestUser, @Param("findingId") findingId: string) {
    return this.findings.sectionRows(user, findingId, "ownership");
  }
  @Post("findings/:findingId/ownership")
  @Permissions(auditPermissions.findingOwnerAssign)
  addFindingOwnership(@CurrentUser() user: RequestUser, @Param("findingId") findingId: string, @Body() dto: Record<string, any>) {
    return this.findings.upsertSection(user, findingId, "ownership", dto);
  }
  @Patch("findings/:findingId/ownership/:ownershipId")
  @Permissions(auditPermissions.findingOwnerAssign)
  patchFindingOwnership(@CurrentUser() user: RequestUser, @Param("findingId") findingId: string, @Param("ownershipId") ownershipId: string, @Body() dto: Record<string, any>) {
    return this.findings.upsertSection(user, findingId, "ownership", dto, ownershipId);
  }
  @Delete("findings/:findingId/ownership/:ownershipId")
  @Permissions(auditPermissions.findingOwnerAssign)
  removeFindingOwnership(@CurrentUser() user: RequestUser, @Param("findingId") findingId: string, @Param("ownershipId") ownershipId: string, @Body() dto: Record<string, any>) {
    return this.findings.removeSection(user, findingId, "ownership", ownershipId, dto.reason);
  }
  @Get("findings/:findingId/capa-foundation")
  @Permissions(auditPermissions.findingCapaFoundationView)
  findingCapaFoundation(@CurrentUser() user: RequestUser, @Param("findingId") findingId: string) {
    return this.findings.sectionRows(user, findingId, "capa-foundation");
  }
  @Post("findings/:findingId/capa-foundation")
  @Permissions(auditPermissions.findingCapaFoundationCreate)
  addFindingCapaFoundation(@CurrentUser() user: RequestUser, @Param("findingId") findingId: string, @Body() dto: Record<string, any>) {
    return this.findings.upsertSection(user, findingId, "capa-foundation", dto);
  }
  @Get("findings/:findingId/review")
  @Permissions(auditPermissions.findingView)
  findingReviewRecords(@CurrentUser() user: RequestUser, @Param("findingId") findingId: string) {
    return this.findings.sectionRows(user, findingId, "review");
  }
  @Post("findings/:findingId/submit-review")
  @Permissions(auditPermissions.findingReviewSubmit)
  submitFindingReview(@CurrentUser() user: RequestUser, @Param("findingId") findingId: string, @Body() dto: Record<string, any>) {
    return this.findings.review(user, findingId, "submit", dto);
  }
  @Post("findings/:findingId/review/approve")
  @Permissions(auditPermissions.findingReviewPerform)
  approveFindingReview(@CurrentUser() user: RequestUser, @Param("findingId") findingId: string, @Body() dto: Record<string, any>) {
    return this.findings.review(user, findingId, "approve", dto);
  }
  @Post("findings/:findingId/review/reject")
  @Permissions(auditPermissions.findingReviewPerform)
  rejectFindingReview(@CurrentUser() user: RequestUser, @Param("findingId") findingId: string, @Body() dto: Record<string, any>) {
    return this.findings.review(user, findingId, "reject", dto);
  }
  @Post("findings/:findingId/review/return")
  @Permissions(auditPermissions.findingReviewPerform)
  returnFindingReview(@CurrentUser() user: RequestUser, @Param("findingId") findingId: string, @Body() dto: Record<string, any>) {
    return this.findings.review(user, findingId, "return", dto);
  }
  @Get("findings/:findingId/history")
  @Permissions(auditPermissions.findingHistoryView)
  findingDetailHistory(@CurrentUser() user: RequestUser, @Param("findingId") findingId: string) {
    return this.findings.sectionRows(user, findingId, "history");
  }
  @Post("execution/:executionId/field-findings/:fieldFindingId/convert")
  @Permissions(auditPermissions.findingConvertFromField)
  convertExecutionFieldFinding(@CurrentUser() user: RequestUser, @Param("executionId") executionId: string, @Param("fieldFindingId") fieldFindingId: string, @Body() dto: Record<string, any>) {
    return this.findings.convertFieldFinding(user, executionId, fieldFindingId, dto);
  }
  @Post("execution/:executionId/responses/:responseId/create-finding")
  @Permissions(auditPermissions.findingCreate)
  createFindingFromResponse(@CurrentUser() user: RequestUser, @Param("executionId") executionId: string, @Param("responseId") responseId: string, @Body() dto: Record<string, any>) {
    return this.findings.createFromResponse(user, executionId, responseId, dto);
  }
  @Post("execution/:executionId/field-notes/:noteId/create-finding")
  @Permissions(auditPermissions.findingCreate)
  createFindingFromFieldNote(@CurrentUser() user: RequestUser, @Param("executionId") executionId: string, @Param("noteId") noteId: string, @Body() dto: Record<string, any>) {
    return this.findings.createFromFieldNote(user, executionId, noteId, dto);
  }
  @Get("execution/:executionId/findings")
  @Permissions(auditPermissions.findingRegisterView)
  executionFormalFindings(@CurrentUser() user: RequestUser, @Param("executionId") executionId: string, @Query() query: Record<string, any>) {
    return this.findings.sourceScopedRegister(user, "execution", executionId, query);
  }
  @Get("plans/:planId/findings")
  @Permissions(auditPermissions.findingRegisterView)
  planFindings(@CurrentUser() user: RequestUser, @Param("planId") planId: string, @Query() query: Record<string, any>) {
    return this.findings.sourceScopedRegister(user, "plan", planId, query);
  }
  @Get("programs/:programId/findings")
  @Permissions(auditPermissions.findingRegisterView)
  programFindings(@CurrentUser() user: RequestUser, @Param("programId") programId: string, @Query() query: Record<string, any>) {
    return this.findings.sourceScopedRegister(user, "program", programId, query);
  }
  @Get("checklists/templates/:checklistId/findings")
  @Permissions(auditPermissions.findingRegisterView)
  checklistFindings(@CurrentUser() user: RequestUser, @Param("checklistId") checklistId: string, @Query() query: Record<string, any>) {
    return this.findings.sourceScopedRegister(user, "checklist", checklistId, query);
  }
  @Get("sites/:siteId/findings")
  @Permissions(auditPermissions.findingRegisterView)
  siteFindings(@CurrentUser() user: RequestUser, @Param("siteId") siteId: string, @Query() query: Record<string, any>) {
    return this.findings.sourceScopedRegister(user, "site", siteId, query);
  }
  @Get("units/:unitId/findings")
  @Permissions(auditPermissions.findingRegisterView)
  unitFindings(@CurrentUser() user: RequestUser, @Param("unitId") unitId: string, @Query() query: Record<string, any>) {
    return this.findings.sourceScopedRegister(user, "unit", unitId, query);
  }
  @Get("areas/:areaId/findings")
  @Permissions(auditPermissions.findingRegisterView)
  areaFindings(@CurrentUser() user: RequestUser, @Param("areaId") areaId: string, @Query() query: Record<string, any>) {
    return this.findings.sourceScopedRegister(user, "area", areaId, query);
  }
  @Get("lookups/finding-statuses")
  @Permissions(auditPermissions.findingView)
  findingStatusLookups() { return this.findings.lookups().findingStatuses; }
  @Get("lookups/finding-types")
  @Permissions(auditPermissions.findingView)
  findingTypeLookups() { return this.findings.lookups().findingTypes; }
  @Get("lookups/finding-severities")
  @Permissions(auditPermissions.findingView)
  findingSeverityLookups() { return this.findings.lookups().findingSeverities; }
  @Get("lookups/finding-priorities")
  @Permissions(auditPermissions.findingView)
  findingPriorityLookups() { return this.findings.lookups().findingPriorities; }
  @Get("lookups/risk-potential-levels")
  @Permissions(auditPermissions.findingView)
  riskPotentialLookups() { return this.findings.lookups().riskPotentialLevels; }
  @Get("lookups/finding-source-types")
  @Permissions(auditPermissions.findingView)
  findingSourceTypeLookups() { return this.findings.lookups().findingSourceTypes; }
  @Get("lookups/finding-review-statuses")
  @Permissions(auditPermissions.findingView)
  findingReviewStatusLookups() { return this.findings.lookups().findingReviewStatuses; }
  @Get("lookups/finding-capa-readiness-statuses")
  @Permissions(auditPermissions.findingView)
  findingCapaReadinessLookups() { return this.findings.lookups().findingCapaReadinessStatuses; }
  @Get("lookups/finding-evidence-statuses")
  @Permissions(auditPermissions.findingView)
  findingEvidenceStatusLookups() { return this.findings.lookups().findingEvidenceStatuses; }
  @Get("lookups/finding-duplicate-repeat-statuses")
  @Permissions(auditPermissions.findingView)
  findingDuplicateStatusLookups() { return this.findings.lookups().findingDuplicateRepeatStatuses; }
  @Get("lookups/finding-recurrence-categories")
  @Permissions(auditPermissions.findingView)
  findingRecurrenceLookups() { return this.findings.lookups().findingRecurrenceCategories; }

  @Get("execution/dashboard")
  @Permissions(auditPermissions.executionDashboardView)
  executionDashboard(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.executions.dashboard(user, query);
  }
  @Get("execution/dashboard/summary")
  @Permissions(auditPermissions.executionDashboardView)
  async executionDashboardSummary(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return (await this.executions.dashboard(user, query)).summary;
  }
  @Get("execution/dashboard/status")
  @Permissions(auditPermissions.executionDashboardView)
  async executionDashboardStatus(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return (await this.executions.dashboard(user, query)).byStatus;
  }
  @Get("execution/dashboard/in-progress")
  @Permissions(auditPermissions.executionDashboardView)
  async executionDashboardInProgress(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return (await this.executions.dashboard(user, query)).inProgress;
  }
  @Get("execution/dashboard/pending-evidence")
  @Permissions(auditPermissions.executionDashboardView)
  async executionDashboardPendingEvidence(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return (await this.executions.dashboard(user, query)).pendingEvidence;
  }
  @Get("execution/dashboard/field-findings")
  @Permissions(auditPermissions.executionDashboardView)
  async executionDashboardFieldFindings(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return (await this.executions.dashboard(user, query)).fieldFindings;
  }
  @Get("execution/dashboard/recent")
  @Permissions(auditPermissions.executionDashboardView)
  async executionDashboardRecent(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return (await this.executions.dashboard(user, query)).recent;
  }
  @Get("execution/context")
  @Permissions(auditPermissions.executionView)
  executionContext(@CurrentUser() user: RequestUser) {
    return this.executions.context(user);
  }
  @Get("execution/lookups")
  @Permissions(auditPermissions.executionView)
  executionLookups() {
    return this.executions.lookups();
  }
  @Get("execution/settings")
  @Permissions(auditPermissions.executionSettingsView)
  executionSettings(@CurrentUser() user: RequestUser, @Query("siteId") siteId?: string) {
    return this.executions.settings(user, siteId ?? null);
  }
  @Patch("execution/settings")
  @Permissions(auditPermissions.executionSettingsEdit)
  patchExecutionSettings(@CurrentUser() user: RequestUser, @Body() dto: Record<string, any>) {
    return this.executions.updateSettings(user, dto);
  }
  @Get("execution/register")
  @Permissions(auditPermissions.executionRegisterView)
  executionRegister(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.executions.register(user, query);
  }
  @Get("execution")
  @Permissions(auditPermissions.executionRegisterView)
  executionRegisterAlias(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.executions.register(user, query);
  }
  @Get("execution/summary")
  @Permissions(auditPermissions.executionRegisterView)
  async executionSummary(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return (await this.executions.register(user, { ...query, page: 1, limit: 500 })).summary;
  }
  @Post("execution")
  @Permissions(auditPermissions.executionCreate)
  createExecution(@CurrentUser() user: RequestUser, @Body() dto: Record<string, any>) {
    return this.executions.create(user, dto);
  }
  @Post("execution/start-from-plan")
  @Permissions(auditPermissions.executionStart)
  startExecutionFromPlanBody(@CurrentUser() user: RequestUser, @Body() dto: Record<string, any>) {
    return this.executions.startFromPlan(user, dto.planId, dto);
  }
  @Get("plans/:planId/execution")
  @Permissions(auditPermissions.executionView)
  planExecution(@CurrentUser() user: RequestUser, @Param("planId") planId: string) {
    return this.executions.planExecution(user, planId);
  }
  @Get("plans/:planId/execution-readiness")
  @Permissions(auditPermissions.executionView)
  planExecutionReadiness(@CurrentUser() user: RequestUser, @Param("planId") planId: string) {
    return this.executions.executionReadinessForPlan(user, planId);
  }
  @Post("plans/:planId/start-execution")
  @Permissions(auditPermissions.executionStart)
  startExecutionFromPlan(@CurrentUser() user: RequestUser, @Param("planId") planId: string, @Body() dto: Record<string, any>) {
    return this.executions.startFromPlan(user, planId, dto);
  }
  @Get("execution/ready-to-start")
  @Permissions(auditPermissions.executionRegisterView)
  readyToStartExecutions(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.executions.register(user, { ...query, status: "Ready To Start" });
  }
  @Get("execution/in-progress")
  @Permissions(auditPermissions.executionRegisterView)
  inProgressExecutions(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.executions.register(user, { ...query, status: "In Progress" });
  }
  @Get("execution/paused")
  @Permissions(auditPermissions.executionRegisterView)
  pausedExecutions(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.executions.register(user, { ...query, status: "Paused" });
  }
  @Get("execution/completed")
  @Permissions(auditPermissions.executionRegisterView)
  completedExecutions(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.executions.register(user, { ...query, status: "Completed" });
  }
  @Get("execution/blocked")
  @Permissions(auditPermissions.executionRegisterView)
  blockedExecutions(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.executions.register(user, { ...query, status: "Blocked" });
  }
  @Get("execution/pending-evidence")
  @Permissions(auditPermissions.executionRegisterView)
  pendingEvidenceExecutions(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.executions.register(user, { ...query, evidenceStatus: "Missing Evidence" });
  }
  @Get("execution/pending-responses")
  @Permissions(auditPermissions.executionRegisterView)
  pendingResponseExecutions(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.executions.register(user, query);
  }
  @Get("execution/safety-critical-findings")
  @Permissions(auditPermissions.fieldFindingView)
  safetyCriticalExecutionFindings(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.executions.findings(user, { ...query, criticality: "Safety-Critical" });
  }
  @Get("execution/regulatory-critical-findings")
  @Permissions(auditPermissions.fieldFindingView)
  regulatoryCriticalExecutionFindings(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.executions.findings(user, { ...query, criticality: "Regulatory-Critical" });
  }
  @Get("execution/ready-for-finding-register")
  @Permissions(auditPermissions.executionRegisterView)
  readyForFindingRegisterExecutions(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.executions.register(user, { ...query, readyForFindingRegister: true });
  }
  @Get("field-findings")
  @Permissions(auditPermissions.fieldFindingView)
  allAuditFieldFindings(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.executions.findings(user, query);
  }
  @Get("field-findings/:findingId")
  @Permissions(auditPermissions.fieldFindingView)
  auditFieldFindingDetail(@CurrentUser() user: RequestUser, @Param("findingId") findingId: string) {
    return this.executions.findings(user, {}, undefined, findingId);
  }
  @Get("sites/:siteId/executions")
  @Permissions(auditPermissions.executionRegisterView)
  siteExecutions(@CurrentUser() user: RequestUser, @Param("siteId") siteId: string, @Query() query: Record<string, any>) {
    return this.executions.register(user, { ...query, siteId });
  }
  @Get("units/:unitId/executions")
  @Permissions(auditPermissions.executionRegisterView)
  unitExecutions(@CurrentUser() user: RequestUser, @Param("unitId") unitId: string, @Query() query: Record<string, any>) {
    return this.executions.register(user, { ...query, unit_id: unitId });
  }
  @Get("areas/:areaId/executions")
  @Permissions(auditPermissions.executionRegisterView)
  areaExecutions(@CurrentUser() user: RequestUser, @Param("areaId") areaId: string, @Query() query: Record<string, any>) {
    return this.executions.register(user, { ...query, area_id: areaId });
  }
  @Get("execution/:executionId")
  @Permissions(auditPermissions.executionView)
  executionDetail(@CurrentUser() user: RequestUser, @Param("executionId") executionId: string) {
    return this.executions.detail(user, executionId);
  }
  @Patch("execution/:executionId")
  @Permissions(auditPermissions.executionCreate)
  patchExecution(@CurrentUser() user: RequestUser, @Param("executionId") executionId: string, @Body() dto: Record<string, any>) {
    return this.executions.update(user, executionId, dto);
  }
  @Post("execution/:executionId/start")
  @Permissions(auditPermissions.executionStart)
  startExecution(@CurrentUser() user: RequestUser, @Param("executionId") executionId: string, @Body() dto: Record<string, any>) {
    return this.executions.transition(user, executionId, "start", dto);
  }
  @Post("execution/:executionId/pause")
  @Permissions(auditPermissions.executionPause)
  pauseExecution(@CurrentUser() user: RequestUser, @Param("executionId") executionId: string, @Body() dto: Record<string, any>) {
    return this.executions.transition(user, executionId, "pause", dto);
  }
  @Post("execution/:executionId/resume")
  @Permissions(auditPermissions.executionResume)
  resumeExecution(@CurrentUser() user: RequestUser, @Param("executionId") executionId: string, @Body() dto: Record<string, any>) {
    return this.executions.transition(user, executionId, "resume", dto);
  }
  @Post("execution/:executionId/complete")
  @Permissions(auditPermissions.executionComplete)
  completeExecution(@CurrentUser() user: RequestUser, @Param("executionId") executionId: string, @Body() dto: Record<string, any>) {
    return this.executions.transition(user, executionId, "complete", dto);
  }
  @Post("execution/:executionId/reopen")
  @Permissions(auditPermissions.executionReopen)
  reopenExecution(@CurrentUser() user: RequestUser, @Param("executionId") executionId: string, @Body() dto: Record<string, any>) {
    return this.executions.transition(user, executionId, "reopen", dto);
  }
  @Post("execution/:executionId/cancel")
  @Permissions(auditPermissions.executionCancel)
  cancelExecution(@CurrentUser() user: RequestUser, @Param("executionId") executionId: string, @Body() dto: Record<string, any>) {
    return this.executions.transition(user, executionId, "cancel", dto);
  }
  @Post("execution/:executionId/archive")
  @Permissions(auditPermissions.executionCancel)
  archiveExecution(@CurrentUser() user: RequestUser, @Param("executionId") executionId: string, @Body() dto: Record<string, any>) {
    return this.executions.transition(user, executionId, "archive", dto);
  }
  @Get("execution/:executionId/workspace")
  @Permissions(auditPermissions.executionWorkspaceView)
  executionWorkspace(@CurrentUser() user: RequestUser, @Param("executionId") executionId: string) {
    return this.executions.workspace(user, executionId);
  }
  @Get("execution/:executionId/checklist")
  @Permissions(auditPermissions.executionWorkspaceView)
  executionChecklist(@CurrentUser() user: RequestUser, @Param("executionId") executionId: string) {
    return this.executions.workspace(user, executionId);
  }
  @Get("execution/:executionId/checklist/sections")
  @Permissions(auditPermissions.executionWorkspaceView)
  async executionChecklistSections(@CurrentUser() user: RequestUser, @Param("executionId") executionId: string) {
    return (await this.executions.workspace(user, executionId)).sections;
  }
  @Get("execution/:executionId/checklist/sections/:sectionId")
  @Permissions(auditPermissions.executionWorkspaceView)
  async executionChecklistSection(@CurrentUser() user: RequestUser, @Param("executionId") executionId: string, @Param("sectionId") sectionId: string) {
    return (await this.executions.workspace(user, executionId)).sections.find((section: any) => section.id === sectionId) ?? null;
  }
  @Get("execution/:executionId/checklist/items/:itemId")
  @Permissions(auditPermissions.executionWorkspaceView)
  async executionChecklistItem(@CurrentUser() user: RequestUser, @Param("executionId") executionId: string, @Param("itemId") itemId: string) {
    return (await this.executions.workspace(user, executionId)).items.find((item: any) => item.id === itemId) ?? null;
  }
  @Post("execution/:executionId/checklist/items/:itemId/response")
  @Permissions(auditPermissions.executionResponseCreate)
  saveExecutionResponse(@CurrentUser() user: RequestUser, @Param("executionId") executionId: string, @Param("itemId") itemId: string, @Body() dto: Record<string, any>) {
    return this.executions.saveResponse(user, executionId, itemId, dto);
  }
  @Patch("execution/:executionId/responses/:responseId")
  @Permissions(auditPermissions.executionResponseEdit)
  updateExecutionResponse(@CurrentUser() user: RequestUser, @Param("executionId") executionId: string, @Param("responseId") responseId: string, @Body() dto: Record<string, any>) {
    return this.executions.saveResponse(user, executionId, dto.executionItemId, dto, responseId);
  }
  @Post("execution/:executionId/responses/:responseId/reopen")
  @Permissions(auditPermissions.executionResponseReopen)
  reopenExecutionResponse(@CurrentUser() user: RequestUser, @Param("executionId") executionId: string, @Param("responseId") responseId: string, @Body() dto: Record<string, any>) {
    return this.executions.reopenResponse(user, executionId, responseId, dto);
  }
  @Post("execution/:executionId/checklist/sections/:sectionId/complete")
  @Permissions(auditPermissions.executionResponseEdit)
  completeExecutionSection(@CurrentUser() user: RequestUser, @Param("executionId") executionId: string, @Param("sectionId") sectionId: string, @Body() dto: Record<string, any>) {
    return this.executions.completeSection(user, executionId, sectionId, dto);
  }
  @Get("execution/:executionId/evidence")
  @Permissions(auditPermissions.executionEvidenceView)
  executionEvidence(@CurrentUser() user: RequestUser, @Param("executionId") executionId: string) {
    return this.executions.evidence(user, executionId);
  }
  @Post("execution/:executionId/evidence")
  @Permissions(auditPermissions.executionEvidenceAdd)
  addExecutionEvidence(@CurrentUser() user: RequestUser, @Param("executionId") executionId: string, @Body() dto: Record<string, any>) {
    return this.executions.saveEvidence(user, executionId, dto);
  }
  @Patch("execution/:executionId/evidence/:evidenceId")
  @Permissions(auditPermissions.executionEvidenceAdd)
  patchExecutionEvidence(@CurrentUser() user: RequestUser, @Param("executionId") executionId: string, @Param("evidenceId") evidenceId: string, @Body() dto: Record<string, any>) {
    return this.executions.saveEvidence(user, executionId, dto, evidenceId);
  }
  @Delete("execution/:executionId/evidence/:evidenceId")
  @Permissions(auditPermissions.executionEvidenceRemove)
  removeExecutionEvidence(@CurrentUser() user: RequestUser, @Param("executionId") executionId: string, @Param("evidenceId") evidenceId: string, @Body() dto: Record<string, any>) {
    return this.executions.removeEvidence(user, executionId, evidenceId, dto);
  }
  @Get("execution/:executionId/field-notes")
  @Permissions(auditPermissions.executionNoteView)
  executionNotes(@CurrentUser() user: RequestUser, @Param("executionId") executionId: string) {
    return this.executions.notes(user, executionId);
  }
  @Post("execution/:executionId/field-notes")
  @Permissions(auditPermissions.executionNoteCreate)
  addExecutionNote(@CurrentUser() user: RequestUser, @Param("executionId") executionId: string, @Body() dto: Record<string, any>) {
    return this.executions.saveNote(user, executionId, dto);
  }
  @Patch("execution/:executionId/field-notes/:noteId")
  @Permissions(auditPermissions.executionNoteEdit)
  patchExecutionNote(@CurrentUser() user: RequestUser, @Param("executionId") executionId: string, @Param("noteId") noteId: string, @Body() dto: Record<string, any>) {
    return this.executions.saveNote(user, executionId, dto, noteId);
  }
  @Delete("execution/:executionId/field-notes/:noteId")
  @Permissions(auditPermissions.executionNoteDelete)
  removeExecutionNote(@CurrentUser() user: RequestUser, @Param("executionId") executionId: string, @Param("noteId") noteId: string, @Body() dto: Record<string, any>) {
    return this.executions.removeNote(user, executionId, noteId, dto);
  }
  @Post("execution/:executionId/field-notes/:noteId/convert-to-finding")
  @Permissions(auditPermissions.fieldFindingCreate)
  convertNoteToFinding(@CurrentUser() user: RequestUser, @Param("executionId") executionId: string, @Param("noteId") noteId: string, @Body() dto: Record<string, any>) {
    return this.executions.convertNoteToFinding(user, executionId, noteId, dto);
  }
  @Get("execution/:executionId/field-findings")
  @Permissions(auditPermissions.fieldFindingView)
  executionFindings(@CurrentUser() user: RequestUser, @Param("executionId") executionId: string) {
    return this.executions.findings(user, {}, executionId);
  }
  @Post("execution/:executionId/field-findings")
  @Permissions(auditPermissions.fieldFindingCreate)
  addExecutionFinding(@CurrentUser() user: RequestUser, @Param("executionId") executionId: string, @Body() dto: Record<string, any>) {
    return this.executions.saveFinding(user, executionId, dto);
  }
  @Patch("execution/:executionId/field-findings/:findingId")
  @Permissions(auditPermissions.fieldFindingEdit)
  patchExecutionFinding(@CurrentUser() user: RequestUser, @Param("executionId") executionId: string, @Param("findingId") findingId: string, @Body() dto: Record<string, any>) {
    return this.executions.saveFinding(user, executionId, dto, findingId);
  }
  @Post("execution/:executionId/field-findings/:findingId/cancel")
  @Permissions(auditPermissions.fieldFindingCancel)
  cancelExecutionFinding(@CurrentUser() user: RequestUser, @Param("executionId") executionId: string, @Param("findingId") findingId: string, @Body() dto: Record<string, any>) {
    return this.executions.cancelFinding(user, executionId, findingId, dto);
  }
  @Post("execution/:executionId/field-findings/:findingId/convert-foundation")
  @Permissions(auditPermissions.fieldFindingConvert)
  convertExecutionFinding(@CurrentUser() user: RequestUser, @Param("executionId") executionId: string, @Param("findingId") findingId: string, @Body() dto: Record<string, any>) {
    return this.executions.convertFinding(user, executionId, findingId, dto);
  }
  @Get("execution/:executionId/interviews")
  @Permissions(auditPermissions.executionInterviewView)
  async executionInterviews(@CurrentUser() user: RequestUser, @Param("executionId") executionId: string) {
    return (await this.executions.detail(user, executionId)).interviews;
  }
  @Post("execution/:executionId/interviews")
  @Permissions(auditPermissions.executionInterviewCreate)
  addExecutionInterview(@CurrentUser() user: RequestUser, @Param("executionId") executionId: string, @Body() dto: Record<string, any>) {
    return this.executions.saveInterview(user, executionId, dto);
  }
  @Patch("execution/:executionId/interviews/:interviewId")
  @Permissions(auditPermissions.executionInterviewEdit)
  patchExecutionInterview(@CurrentUser() user: RequestUser, @Param("executionId") executionId: string, @Param("interviewId") interviewId: string, @Body() dto: Record<string, any>) {
    return this.executions.saveInterview(user, executionId, dto, interviewId);
  }
  @Delete("execution/:executionId/interviews/:interviewId")
  @Permissions(auditPermissions.executionInterviewEdit)
  deleteExecutionInterview(@CurrentUser() user: RequestUser, @Param("executionId") executionId: string, @Param("interviewId") interviewId: string, @Body() dto: Record<string, any>) {
    return this.executions.removeChild(user, executionId, "audit_execution_interviews", interviewId, dto.reason);
  }
  @Get("execution/:executionId/walkthroughs")
  @Permissions(auditPermissions.executionWalkthroughView)
  async executionWalkthroughs(@CurrentUser() user: RequestUser, @Param("executionId") executionId: string) {
    return (await this.executions.detail(user, executionId)).walkthroughs;
  }
  @Post("execution/:executionId/walkthroughs")
  @Permissions(auditPermissions.executionWalkthroughCreate)
  addExecutionWalkthrough(@CurrentUser() user: RequestUser, @Param("executionId") executionId: string, @Body() dto: Record<string, any>) {
    return this.executions.saveWalkthrough(user, executionId, dto);
  }
  @Patch("execution/:executionId/walkthroughs/:walkthroughId")
  @Permissions(auditPermissions.executionWalkthroughEdit)
  patchExecutionWalkthrough(@CurrentUser() user: RequestUser, @Param("executionId") executionId: string, @Param("walkthroughId") walkthroughId: string, @Body() dto: Record<string, any>) {
    return this.executions.saveWalkthrough(user, executionId, dto, walkthroughId);
  }
  @Delete("execution/:executionId/walkthroughs/:walkthroughId")
  @Permissions(auditPermissions.executionWalkthroughEdit)
  deleteExecutionWalkthrough(@CurrentUser() user: RequestUser, @Param("executionId") executionId: string, @Param("walkthroughId") walkthroughId: string, @Body() dto: Record<string, any>) {
    return this.executions.removeChild(user, executionId, "audit_execution_walkthroughs", walkthroughId, dto.reason);
  }
  @Get("execution/:executionId/progress")
  @Permissions(auditPermissions.executionView)
  executionProgress(@CurrentUser() user: RequestUser, @Param("executionId") executionId: string) {
    return this.executions.progress(user, executionId);
  }
  @Get("execution/:executionId/readiness")
  @Permissions(auditPermissions.executionView)
  async executionReadiness(@CurrentUser() user: RequestUser, @Param("executionId") executionId: string) {
    return (await this.executions.detail(user, executionId)).readiness;
  }
  @Post("execution/:executionId/readiness/run")
  @Permissions(auditPermissions.executionReadinessRun)
  runExecutionReadiness(@CurrentUser() user: RequestUser, @Param("executionId") executionId: string) {
    return this.executions.runReadiness(user, executionId);
  }
  @Post("execution/:executionId/validate")
  @Permissions(auditPermissions.executionReadinessRun)
  validateExecution(@CurrentUser() user: RequestUser, @Param("executionId") executionId: string) {
    return this.executions.validate(user, executionId);
  }
  @Get("execution/:executionId/activity")
  @Permissions(auditPermissions.executionView)
  executionActivity(@CurrentUser() user: RequestUser, @Param("executionId") executionId: string) {
    return this.executions.activity(user, executionId);
  }
  @Get("execution/:executionId/history")
  @Permissions(auditPermissions.executionHistoryView)
  executionHistory(@CurrentUser() user: RequestUser, @Param("executionId") executionId: string) {
    return this.executions.historyRows(user, executionId);
  }

  @Get("checklists/dashboard")
  @Permissions(auditPermissions.checklistDashboardView)
  checklistDashboard(
    @CurrentUser() user: RequestUser,
    @Query() query: Record<string, any>,
  ) {
    return this.checklists.dashboard(user, query);
  }
  @Get("checklists/dashboard/summary")
  @Permissions(auditPermissions.checklistDashboardView)
  async checklistDashboardSummary(
    @CurrentUser() user: RequestUser,
    @Query() query: Record<string, any>,
  ) {
    return (await this.checklists.dashboard(user, query)).summary;
  }
  @Get("checklists/dashboard/status")
  @Permissions(auditPermissions.checklistDashboardView)
  async checklistDashboardStatus(
    @CurrentUser() user: RequestUser,
    @Query() query: Record<string, any>,
  ) {
    return (await this.checklists.dashboard(user, query)).byStatus;
  }
  @Get("checklists/dashboard/configuration-gaps")
  @Permissions(auditPermissions.checklistDashboardView)
  async checklistConfigurationGaps(
    @CurrentUser() user: RequestUser,
    @Query() query: Record<string, any>,
  ) {
    return (await this.checklists.dashboard(user, query)).configurationGaps;
  }
  @Get("checklists/dashboard/plan-missing-checklists")
  @Permissions(auditPermissions.checklistDashboardView)
  async checklistPlansMissing(
    @CurrentUser() user: RequestUser,
    @Query() query: Record<string, any>,
  ) {
    return (await this.checklists.dashboard(user, query)).plansMissingChecklist;
  }
  @Get("checklists/dashboard/recent")
  @Permissions(auditPermissions.checklistDashboardView)
  async checklistRecent(
    @CurrentUser() user: RequestUser,
    @Query() query: Record<string, any>,
  ) {
    return (await this.checklists.dashboard(user, query)).recent;
  }
  @Get("checklists/context")
  @Permissions(auditPermissions.checklistView)
  checklistContext(@CurrentUser() user: RequestUser) {
    return this.checklists.context(user);
  }
  @Get("checklists/templates")
  @Permissions(auditPermissions.checklistTemplateView)
  checklistTemplates(
    @CurrentUser() user: RequestUser,
    @Query() query: Record<string, any>,
  ) {
    return this.checklists.register(user, query);
  }
  @Get("checklists/templates/summary")
  @Permissions(auditPermissions.checklistTemplateView)
  async checklistTemplateSummary(
    @CurrentUser() user: RequestUser,
    @Query() query: Record<string, any>,
  ) {
    return (
      await this.checklists.register(user, { ...query, page: 1, limit: 250 })
    ).summary;
  }
  @Post("checklists/templates")
  @Permissions(auditPermissions.checklistTemplateCreate)
  createChecklist(
    @CurrentUser() user: RequestUser,
    @Body() dto: Record<string, any>,
  ) {
    return this.checklists.create(user, dto);
  }
  @Get("checklists/question-bank")
  @Permissions(auditPermissions.checklistQuestionBankView)
  questionBank(
    @CurrentUser() user: RequestUser,
    @Query() query: Record<string, any>,
  ) {
    return this.checklists.questionBank(user, query);
  }
  @Post("checklists/question-bank")
  @Permissions(auditPermissions.checklistQuestionBankCreate)
  createQuestion(
    @CurrentUser() user: RequestUser,
    @Body() dto: Record<string, any>,
  ) {
    return this.checklists.saveQuestion(user, dto);
  }
  @Get("checklists/question-bank/:questionId")
  @Permissions(auditPermissions.checklistQuestionBankView)
  questionDetail(
    @CurrentUser() user: RequestUser,
    @Param("questionId") id: string,
  ) {
    return this.checklists.question(user, id);
  }
  @Patch("checklists/question-bank/:questionId")
  @Permissions(auditPermissions.checklistQuestionBankEdit)
  patchQuestion(
    @CurrentUser() user: RequestUser,
    @Param("questionId") id: string,
    @Body() dto: Record<string, any>,
  ) {
    return this.checklists.saveQuestion(user, dto, id);
  }
  @Post("checklists/question-bank/:questionId/archive")
  @Permissions(auditPermissions.checklistQuestionBankArchive)
  archiveQuestion(
    @CurrentUser() user: RequestUser,
    @Param("questionId") id: string,
    @Body() dto: Record<string, any>,
  ) {
    return this.checklists.questionTransition(user, id, "archive", dto);
  }
  @Post("checklists/question-bank/:questionId/reactivate")
  @Permissions(auditPermissions.checklistQuestionBankEdit)
  reactivateQuestion(
    @CurrentUser() user: RequestUser,
    @Param("questionId") id: string,
  ) {
    return this.checklists.questionTransition(user, id, "reactivate");
  }
  @Post("checklists/question-bank/:questionId/create-version")
  @Permissions(auditPermissions.checklistQuestionBankCreate)
  versionQuestion(
    @CurrentUser() user: RequestUser,
    @Param("questionId") id: string,
    @Body() dto: Record<string, any>,
  ) {
    return this.checklists.questionTransition(user, id, "create-version", dto);
  }
  @Get("checklists/assigned")
  @Permissions(auditPermissions.checklistAssignmentView)
  assignedChecklists(
    @CurrentUser() user: RequestUser,
    @Query() query: Record<string, any>,
  ) {
    return this.checklists.register(user, query);
  }
  @Get("checklists/missing-from-plans")
  @Permissions(auditPermissions.checklistAssignmentView)
  async missingPlanChecklists(
    @CurrentUser() user: RequestUser,
    @Query() query: Record<string, any>,
  ) {
    return (await this.checklists.dashboard(user, query)).plansMissingChecklist;
  }
  @Get("checklists/ready-for-execution")
  @Permissions(auditPermissions.checklistTemplateView)
  readyChecklists(
    @CurrentUser() user: RequestUser,
    @Query() query: Record<string, any>,
  ) {
    return this.checklists.register(user, {
      ...query,
      readinessHealth: "Ready For Execution",
    });
  }
  @Get("checklists/pending-review")
  @Permissions(auditPermissions.checklistTemplateView)
  pendingReviewChecklists(
    @CurrentUser() user: RequestUser,
    @Query() query: Record<string, any>,
  ) {
    return this.checklists.register(user, {
      ...query,
      status: "Pending Review",
    });
  }
  @Get("checklists/review-overdue")
  @Permissions(auditPermissions.checklistTemplateView)
  overdueReviewChecklists(
    @CurrentUser() user: RequestUser,
    @Query() query: Record<string, any>,
  ) {
    return this.checklists.register(user, {
      ...query,
      status: "Review Overdue",
    });
  }
  @Get("checklists/archived")
  @Permissions(auditPermissions.checklistTemplateView)
  archivedChecklists(
    @CurrentUser() user: RequestUser,
    @Query() query: Record<string, any>,
  ) {
    return this.checklists.register(user, { ...query, status: "Archived" });
  }
  @Get("checklists/history")
  @Permissions(auditPermissions.checklistHistoryView)
  checklistHistory(@CurrentUser() user: RequestUser) {
    return this.checklists.historyRows(user);
  }
  @Get("checklists/settings")
  @Permissions(auditPermissions.checklistSettingsView)
  checklistSettings(
    @CurrentUser() user: RequestUser,
    @Query("siteId") siteId?: string,
  ) {
    return this.checklists.settings(user, siteId);
  }
  @Patch("checklists/settings")
  @Permissions(auditPermissions.checklistSettingsEdit)
  patchChecklistSettings(
    @CurrentUser() user: RequestUser,
    @Body() dto: Record<string, any>,
  ) {
    return this.checklists.updateSettings(user, dto);
  }
  @Get("checklists/templates/:checklistId")
  @Permissions(auditPermissions.checklistTemplateView)
  checklistDetail(
    @CurrentUser() user: RequestUser,
    @Param("checklistId") id: string,
  ) {
    return this.checklists.detail(user, id);
  }
  @Patch("checklists/templates/:checklistId")
  @Permissions(auditPermissions.checklistTemplateEdit)
  patchChecklist(
    @CurrentUser() user: RequestUser,
    @Param("checklistId") id: string,
    @Body() dto: Record<string, any>,
  ) {
    return this.checklists.update(user, id, dto);
  }
  @Post("checklists/templates/:checklistId/activate")
  @Permissions(auditPermissions.checklistTemplateActivate)
  activateChecklist(
    @CurrentUser() user: RequestUser,
    @Param("checklistId") id: string,
  ) {
    return this.checklists.transition(user, id, "activate");
  }
  @Post("checklists/templates/:checklistId/archive")
  @Permissions(auditPermissions.checklistTemplateArchive)
  archiveChecklist(
    @CurrentUser() user: RequestUser,
    @Param("checklistId") id: string,
    @Body() dto: Record<string, any>,
  ) {
    return this.checklists.transition(user, id, "archive", dto);
  }
  @Post("checklists/templates/:checklistId/reactivate")
  @Permissions(auditPermissions.checklistTemplateReactivate)
  reactivateChecklist(
    @CurrentUser() user: RequestUser,
    @Param("checklistId") id: string,
  ) {
    return this.checklists.transition(user, id, "reactivate");
  }
  @Post("checklists/templates/:checklistId/submit-review")
  @Permissions(auditPermissions.checklistSubmitReview)
  submitChecklistReview(
    @CurrentUser() user: RequestUser,
    @Param("checklistId") id: string,
  ) {
    return this.checklists.transition(user, id, "submit-review");
  }
  @Post("checklists/templates/:checklistId/review/approve")
  @Permissions(auditPermissions.checklistReview)
  approveChecklist(
    @CurrentUser() user: RequestUser,
    @Param("checklistId") id: string,
    @Body() dto: Record<string, any>,
  ) {
    return this.checklists.review(user, id, "approve", dto);
  }
  @Post("checklists/templates/:checklistId/review/reject")
  @Permissions(auditPermissions.checklistReview)
  rejectChecklist(
    @CurrentUser() user: RequestUser,
    @Param("checklistId") id: string,
    @Body() dto: Record<string, any>,
  ) {
    return this.checklists.review(user, id, "reject", dto);
  }
  @Post("checklists/templates/:checklistId/create-version")
  @Permissions(auditPermissions.checklistTemplateVersionCreate)
  versionChecklist(
    @CurrentUser() user: RequestUser,
    @Param("checklistId") id: string,
    @Body() dto: Record<string, any>,
  ) {
    return this.checklists.createVersion(user, id, dto);
  }
  @Post("checklists/templates/:checklistId/calculate-readiness")
  @Permissions(auditPermissions.checklistReadinessRun)
  calculateChecklistReadiness(
    @CurrentUser() user: RequestUser,
    @Param("checklistId") id: string,
  ) {
    return this.checklists.readiness(user, id);
  }
  @Post("checklists/templates/:checklistId/duplicate")
  @Permissions(auditPermissions.checklistTemplateCreate)
  duplicateChecklist(
    @CurrentUser() user: RequestUser,
    @Param("checklistId") id: string,
    @Body() dto: Record<string, any>,
  ) {
    return this.checklists.duplicate(user, id, dto);
  }
  @Get("checklists/templates/:checklistId/history")
  @Permissions(auditPermissions.checklistHistoryView)
  oneChecklistHistory(
    @CurrentUser() user: RequestUser,
    @Param("checklistId") id: string,
  ) {
    return this.checklists.historyRows(user, id);
  }
  @Post("checklists/templates/:checklistId/sections/reorder")
  @Permissions(auditPermissions.checklistSectionManage)
  reorderChecklistSections(
    @CurrentUser() user: RequestUser,
    @Param("checklistId") id: string,
    @Body() dto: Record<string, any>,
  ) {
    return this.checklists.reorder(user, id, "sections", dto);
  }
  @Post("checklists/templates/:checklistId/items/reorder")
  @Permissions(auditPermissions.checklistItemManage)
  reorderChecklistItems(
    @CurrentUser() user: RequestUser,
    @Param("checklistId") id: string,
    @Body() dto: Record<string, any>,
  ) {
    return this.checklists.reorder(user, id, "items", dto);
  }
  @Post("checklists/templates/:checklistId/items/add-from-question-bank")
  @Permissions(auditPermissions.checklistItemManage)
  addQuestionToChecklist(
    @CurrentUser() user: RequestUser,
    @Param("checklistId") id: string,
    @Body() dto: Record<string, any>,
  ) {
    return this.checklists.addFromQuestionBank(user, id, dto);
  }
  @Post("checklists/templates/:checklistId/items/:itemId/duplicate")
  @Permissions(auditPermissions.checklistItemManage)
  duplicateChecklistItem(
    @CurrentUser() user: RequestUser,
    @Param("checklistId") id: string,
    @Param("itemId") itemId: string,
    @Body() dto: Record<string, any>,
  ) {
    return this.checklists.duplicateItem(user, id, itemId, dto);
  }
  @Post("checklists/templates/:checklistId/items/:itemId/move")
  @Permissions(auditPermissions.checklistItemManage)
  moveChecklistItem(
    @CurrentUser() user: RequestUser,
    @Param("checklistId") id: string,
    @Param("itemId") itemId: string,
    @Body() dto: Record<string, any>,
  ) {
    return this.checklists.moveItem(user, id, itemId, dto);
  }
  @Get("checklists/templates/:checklistId/sections")
  @Permissions(auditPermissions.checklistTemplateView)
  checklistSections(
    @CurrentUser() user: RequestUser,
    @Param("checklistId") id: string,
  ) {
    return this.checklists.children(user, id, "sections");
  }
  @Post("checklists/templates/:checklistId/sections")
  @Permissions(auditPermissions.checklistSectionManage)
  addChecklistSection(
    @CurrentUser() user: RequestUser,
    @Param("checklistId") id: string,
    @Body() dto: Record<string, any>,
  ) {
    return this.checklists.saveChild(user, id, "sections", dto);
  }
  @Patch("checklists/templates/:checklistId/sections/:rowId")
  @Permissions(auditPermissions.checklistSectionManage)
  patchChecklistSection(
    @CurrentUser() user: RequestUser,
    @Param("checklistId") id: string,
    @Param("rowId") rowId: string,
    @Body() dto: Record<string, any>,
  ) {
    return this.checklists.saveChild(user, id, "sections", dto, rowId);
  }
  @Delete("checklists/templates/:checklistId/sections/:rowId")
  @Permissions(auditPermissions.checklistSectionManage)
  deleteChecklistSection(
    @CurrentUser() user: RequestUser,
    @Param("checklistId") id: string,
    @Param("rowId") rowId: string,
    @Body() dto: Record<string, any>,
  ) {
    return this.checklists.removeChild(user, id, "sections", rowId, dto);
  }
  @Get("checklists/templates/:checklistId/items")
  @Permissions(auditPermissions.checklistTemplateView)
  checklistItems(
    @CurrentUser() user: RequestUser,
    @Param("checklistId") id: string,
  ) {
    return this.checklists.children(user, id, "items");
  }
  @Post("checklists/templates/:checklistId/items")
  @Permissions(auditPermissions.checklistItemManage)
  addChecklistItem(
    @CurrentUser() user: RequestUser,
    @Param("checklistId") id: string,
    @Body() dto: Record<string, any>,
  ) {
    return this.checklists.saveChild(user, id, "items", dto);
  }
  @Patch("checklists/templates/:checklistId/items/:rowId")
  @Permissions(auditPermissions.checklistItemManage)
  patchChecklistItem(
    @CurrentUser() user: RequestUser,
    @Param("checklistId") id: string,
    @Param("rowId") rowId: string,
    @Body() dto: Record<string, any>,
  ) {
    return this.checklists.saveChild(user, id, "items", dto, rowId);
  }
  @Delete("checklists/templates/:checklistId/items/:rowId")
  @Permissions(auditPermissions.checklistItemManage)
  deleteChecklistItem(
    @CurrentUser() user: RequestUser,
    @Param("checklistId") id: string,
    @Param("rowId") rowId: string,
    @Body() dto: Record<string, any>,
  ) {
    return this.checklists.removeChild(user, id, "items", rowId, dto);
  }
  @Get("checklists/templates/:checklistId/standards")
  @Permissions(auditPermissions.checklistTemplateView)
  checklistStandards(
    @CurrentUser() user: RequestUser,
    @Param("checklistId") id: string,
  ) {
    return this.checklists.children(user, id, "standards");
  }
  @Post("checklists/templates/:checklistId/standards")
  @Permissions(auditPermissions.checklistStandardManage)
  addChecklistStandard(
    @CurrentUser() user: RequestUser,
    @Param("checklistId") id: string,
    @Body() dto: Record<string, any>,
  ) {
    return this.checklists.saveChild(user, id, "standards", dto);
  }
  @Patch("checklists/templates/:checklistId/standards/:rowId")
  @Permissions(auditPermissions.checklistStandardManage)
  patchChecklistStandard(
    @CurrentUser() user: RequestUser,
    @Param("checklistId") id: string,
    @Param("rowId") rowId: string,
    @Body() dto: Record<string, any>,
  ) {
    return this.checklists.saveChild(user, id, "standards", dto, rowId);
  }
  @Delete("checklists/templates/:checklistId/standards/:rowId")
  @Permissions(auditPermissions.checklistStandardManage)
  deleteChecklistStandard(
    @CurrentUser() user: RequestUser,
    @Param("checklistId") id: string,
    @Param("rowId") rowId: string,
    @Body() dto: Record<string, any>,
  ) {
    return this.checklists.removeChild(user, id, "standards", rowId, dto);
  }
  @Get("checklists/templates/:checklistId/modules")
  @Permissions(auditPermissions.checklistTemplateView)
  checklistModules(
    @CurrentUser() user: RequestUser,
    @Param("checklistId") id: string,
  ) {
    return this.checklists.children(user, id, "modules");
  }
  @Post("checklists/templates/:checklistId/modules")
  @Permissions(auditPermissions.checklistModuleManage)
  addChecklistModule(
    @CurrentUser() user: RequestUser,
    @Param("checklistId") id: string,
    @Body() dto: Record<string, any>,
  ) {
    return this.checklists.saveChild(user, id, "modules", dto);
  }
  @Patch("checklists/templates/:checklistId/modules/:rowId")
  @Permissions(auditPermissions.checklistModuleManage)
  patchChecklistModule(
    @CurrentUser() user: RequestUser,
    @Param("checklistId") id: string,
    @Param("rowId") rowId: string,
    @Body() dto: Record<string, any>,
  ) {
    return this.checklists.saveChild(user, id, "modules", dto, rowId);
  }
  @Delete("checklists/templates/:checklistId/modules/:rowId")
  @Permissions(auditPermissions.checklistModuleManage)
  deleteChecklistModule(
    @CurrentUser() user: RequestUser,
    @Param("checklistId") id: string,
    @Param("rowId") rowId: string,
    @Body() dto: Record<string, any>,
  ) {
    return this.checklists.removeChild(user, id, "modules", rowId, dto);
  }
  @Get("checklists/templates/:checklistId/scope")
  @Permissions(auditPermissions.checklistTemplateView)
  checklistScope(
    @CurrentUser() user: RequestUser,
    @Param("checklistId") id: string,
  ) {
    return this.checklists.children(user, id, "scope");
  }
  @Post("checklists/templates/:checklistId/scope")
  @Permissions(auditPermissions.checklistScopeManage)
  addChecklistScope(
    @CurrentUser() user: RequestUser,
    @Param("checklistId") id: string,
    @Body() dto: Record<string, any>,
  ) {
    return this.checklists.saveChild(user, id, "scope", dto);
  }
  @Patch("checklists/templates/:checklistId/scope/:rowId")
  @Permissions(auditPermissions.checklistScopeManage)
  patchChecklistScope(
    @CurrentUser() user: RequestUser,
    @Param("checklistId") id: string,
    @Param("rowId") rowId: string,
    @Body() dto: Record<string, any>,
  ) {
    return this.checklists.saveChild(user, id, "scope", dto, rowId);
  }
  @Delete("checklists/templates/:checklistId/scope/:rowId")
  @Permissions(auditPermissions.checklistScopeManage)
  deleteChecklistScope(
    @CurrentUser() user: RequestUser,
    @Param("checklistId") id: string,
    @Param("rowId") rowId: string,
    @Body() dto: Record<string, any>,
  ) {
    return this.checklists.removeChild(user, id, "scope", rowId, dto);
  }
  @Post("plans/:planId/assign-checklist")
  @Permissions(auditPermissions.checklistAssignmentManage)
  assignChecklist(
    @CurrentUser() user: RequestUser,
    @Param("planId") planId: string,
    @Body() dto: Record<string, any>,
  ) {
    return this.checklists.assign(user, planId, dto);
  }
  @Get("plans/:planId/checklist")
  @Permissions(auditPermissions.checklistAssignmentView)
  planChecklist(
    @CurrentUser() user: RequestUser,
    @Param("planId") planId: string,
  ) {
    return this.checklists.planChecklist(user, planId);
  }
  @Get("plans/:planId/checklist-readiness")
  @Permissions(auditPermissions.checklistAssignmentView)
  planChecklistReadiness(
    @CurrentUser() user: RequestUser,
    @Param("planId") planId: string,
  ) {
    return this.checklists.planChecklist(user, planId);
  }
  @Delete("plans/:planId/checklist/:assignmentId")
  @Permissions(auditPermissions.checklistAssignmentManage)
  removePlanChecklist(
    @CurrentUser() user: RequestUser,
    @Param("planId") planId: string,
    @Param("assignmentId") assignmentId: string,
    @Body() dto: Record<string, any>,
  ) {
    return this.checklists.removeAssignment(user, planId, assignmentId, dto);
  }
  @Get("programs/:programId/checklists")
  @Permissions(auditPermissions.checklistTemplateView)
  programChecklists(
    @CurrentUser() user: RequestUser,
    @Param("programId") programId: string,
  ) {
    return this.checklists.programChecklists(user, programId);
  }
  @Post("programs/:programId/create-checklist")
  @Permissions(auditPermissions.checklistTemplateCreate)
  createProgramChecklist(
    @CurrentUser() user: RequestUser,
    @Param("programId") programId: string,
    @Body() dto: Record<string, any>,
  ) {
    return this.checklists.create(user, { ...dto, programId });
  }
  @Get("sites/:siteId/checklists")
  @Permissions(auditPermissions.checklistTemplateView)
  siteChecklists(
    @CurrentUser() user: RequestUser,
    @Param("siteId") siteId: string,
    @Query() query: Record<string, any>,
  ) {
    return this.checklists.register(user, { ...query, siteId });
  }
  @Get("units/:unitId/checklists")
  @Permissions(auditPermissions.checklistTemplateView)
  unitChecklists(
    @CurrentUser() user: RequestUser,
    @Param("unitId") unitId: string,
    @Query() query: Record<string, any>,
  ) {
    return this.checklists.scoped(user, "unit_id", unitId, query);
  }
  @Get("areas/:areaId/checklists")
  @Permissions(auditPermissions.checklistTemplateView)
  areaChecklists(
    @CurrentUser() user: RequestUser,
    @Param("areaId") areaId: string,
    @Query() query: Record<string, any>,
  ) {
    return this.checklists.scoped(user, "area_id", areaId, query);
  }
  @Get("lookups/checklist-statuses")
  @Permissions(auditPermissions.checklistView)
  checklistStatuses() {
    return this.checklists.lookups().checklistStatuses;
  }
  @Get("lookups/checklist-readiness-statuses")
  @Permissions(auditPermissions.checklistView)
  checklistReadinessStatuses() {
    return this.checklists.lookups().readinessStatuses;
  }
  @Get("lookups/checklist-template-types")
  @Permissions(auditPermissions.checklistView)
  checklistTemplateTypes() {
    return this.checklists.lookups().templateTypes;
  }
  @Get("lookups/checklist-categories")
  @Permissions(auditPermissions.checklistView)
  checklistCategories() {
    return [
      "Compliance",
      "Governance",
      "Operational",
      "Regulatory",
      "Process Safety",
      "Custom",
    ];
  }
  @Get("lookups/question-types")
  @Permissions(auditPermissions.checklistView)
  checklistQuestionTypes() {
    return this.checklists.lookups().questionTypes;
  }
  @Get("lookups/response-types")
  @Permissions(auditPermissions.checklistView)
  checklistResponseTypes() {
    return this.checklists.lookups().responseTypes;
  }
  @Get("lookups/item-severities")
  @Permissions(auditPermissions.checklistView)
  checklistItemSeverities() {
    return this.checklists.lookups().criticalities;
  }
  @Get("lookups/question-bank-statuses")
  @Permissions(auditPermissions.checklistView)
  checklistQuestionBankStatuses() {
    return this.checklists.lookups().questionBankStatuses;
  }

  @Get()
  @Permissions(auditPermissions.dashboardView)
  root(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    return this.dashboardService.dashboard(user, query);
  }

  @Get("dashboard")
  @Permissions(auditPermissions.dashboardView)
  dashboard(
    @CurrentUser() user: RequestUser,
    @Query() query: Record<string, any>,
  ) {
    return this.dashboardService.dashboard(user, query);
  }

  @Get("dashboard/summary")
  @Permissions(auditPermissions.dashboardView)
  dashboardSummary(
    @CurrentUser() user: RequestUser,
    @Query() query: Record<string, any>,
  ) {
    return this.dashboardService.summary(user, query);
  }

  @Get("dashboard/program-status")
  @Permissions(auditPermissions.dashboardView)
  async programStatus(
    @CurrentUser() user: RequestUser,
    @Query() query: Record<string, any>,
  ) {
    return (await this.dashboardService.dashboard(user, query)).statusBySite;
  }

  @Get("dashboard/module-coverage")
  @Permissions(auditPermissions.dashboardView)
  async moduleCoverage(
    @CurrentUser() user: RequestUser,
    @Query() query: Record<string, any>,
  ) {
    return (await this.dashboardService.dashboard(user, query)).moduleCoverage;
  }

  @Get("dashboard/site-coverage")
  @Permissions(auditPermissions.dashboardView)
  async siteCoverage(
    @CurrentUser() user: RequestUser,
    @Query() query: Record<string, any>,
  ) {
    return (await this.dashboardService.dashboard(user, query))
      .siteCoverageGaps;
  }

  @Get("dashboard/configuration-gaps")
  @Permissions(auditPermissions.dashboardView)
  async configurationGaps(
    @CurrentUser() user: RequestUser,
    @Query() query: Record<string, any>,
  ) {
    return (await this.dashboardService.dashboard(user, query))
      .configurationGaps;
  }

  @Get("dashboard/recent-programs")
  @Permissions(auditPermissions.dashboardView)
  async recentPrograms(
    @CurrentUser() user: RequestUser,
    @Query() query: Record<string, any>,
  ) {
    const data = await this.dashboardService.dashboard(user, query);
    return {
      recentlyCreatedPrograms: data.recentlyCreatedPrograms,
      recentlyUpdatedPrograms: data.recentlyUpdatedPrograms,
    };
  }

  @Get("plans/dashboard")
  @Permissions(auditPermissions.planDashboardView)
  planDashboard(
    @CurrentUser() user: RequestUser,
    @Query() query: Record<string, any>,
  ) {
    return this.plans.dashboard(user, query);
  }
  @Get("plans/dashboard/summary")
  @Permissions(auditPermissions.planDashboardView)
  async planDashboardSummary(
    @CurrentUser() user: RequestUser,
    @Query() query: Record<string, any>,
  ) {
    return (await this.plans.dashboard(user, query)).summary;
  }
  @Get("plans/dashboard/status")
  @Permissions(auditPermissions.planDashboardView)
  async planDashboardStatus(
    @CurrentUser() user: RequestUser,
    @Query() query: Record<string, any>,
  ) {
    return (await this.plans.dashboard(user, query)).byStatus;
  }
  @Get("plans/dashboard/upcoming")
  @Permissions(auditPermissions.planDashboardView)
  async planDashboardUpcoming(
    @CurrentUser() user: RequestUser,
    @Query() query: Record<string, any>,
  ) {
    return (await this.plans.dashboard(user, query)).upcoming;
  }
  @Get("plans/dashboard/overdue")
  @Permissions(auditPermissions.planDashboardView)
  async planDashboardOverdue(
    @CurrentUser() user: RequestUser,
    @Query() query: Record<string, any>,
  ) {
    return (await this.plans.dashboard(user, query)).overdue;
  }
  @Get("plans/dashboard/conflicts")
  @Permissions(auditPermissions.planDashboardView)
  async planDashboardConflicts(
    @CurrentUser() user: RequestUser,
    @Query() query: Record<string, any>,
  ) {
    return (await this.plans.dashboard(user, query)).conflicts;
  }
  @Get("plans/dashboard/readiness-gaps")
  @Permissions(auditPermissions.planDashboardView)
  async planDashboardGaps(
    @CurrentUser() user: RequestUser,
    @Query() query: Record<string, any>,
  ) {
    return (await this.plans.dashboard(user, query)).readinessGaps;
  }
  @Get("plans/calendar")
  @Permissions(auditPermissions.planCalendarView)
  planCalendar(
    @CurrentUser() user: RequestUser,
    @Query() query: Record<string, any>,
  ) {
    return this.plans.calendar(user, query);
  }
  @Get("plans/calendar/month")
  @Permissions(auditPermissions.planCalendarView)
  planCalendarMonth(
    @CurrentUser() user: RequestUser,
    @Query() query: Record<string, any>,
  ) {
    return this.plans.calendar(user, { ...query, view: "month" });
  }
  @Get("plans/calendar/week")
  @Permissions(auditPermissions.planCalendarView)
  planCalendarWeek(
    @CurrentUser() user: RequestUser,
    @Query() query: Record<string, any>,
  ) {
    return this.plans.calendar(user, { ...query, view: "week" });
  }
  @Get("plans/calendar/agenda")
  @Permissions(auditPermissions.planCalendarView)
  planCalendarAgenda(
    @CurrentUser() user: RequestUser,
    @Query() query: Record<string, any>,
  ) {
    return this.plans.calendar(user, { ...query, view: "agenda" });
  }
  @Get("plans/context") @Permissions(auditPermissions.planView) planContext(
    @CurrentUser() user: RequestUser,
  ) {
    return this.plans.context(user);
  }
  @Get("plans/lookups") @Permissions(auditPermissions.planView) planLookups() {
    return this.plans.lookups();
  }
  @Get("plans/settings")
  @Permissions(auditPermissions.planSettingsView)
  getPlanSettings(
    @CurrentUser() user: RequestUser,
    @Query("siteId") siteId?: string,
  ) {
    return this.planSettings.get(user, siteId);
  }
  @Patch("plans/settings")
  @Permissions(auditPermissions.planSettingsEdit)
  patchPlanSettings(
    @CurrentUser() user: RequestUser,
    @Body() dto: Record<string, any>,
  ) {
    return this.planSettings.update(user, dto);
  }
  @Get("plans/history")
  @Permissions(auditPermissions.planHistoryView)
  planHistory(@CurrentUser() user: RequestUser) {
    return this.plans.historyRows(user);
  }
  @Get("plans/register")
  @Permissions(auditPermissions.planView)
  planRegisterAlias(
    @CurrentUser() user: RequestUser,
    @Query() query: Record<string, any>,
  ) {
    return this.plans.register(user, query);
  }
  @Get("plans/summary")
  @Permissions(auditPermissions.planView)
  async planSummary(
    @CurrentUser() user: RequestUser,
    @Query() query: Record<string, any>,
  ) {
    return (await this.plans.register(user, { ...query, page: 1, limit: 100 }))
      .summary;
  }
  @Get("plans/upcoming") @Permissions(auditPermissions.planView) planUpcoming(
    @CurrentUser() user: RequestUser,
    @Query() query: Record<string, any>,
  ) {
    return this.plans.register(user, { ...query, scheduleStatus: "Upcoming" });
  }
  @Get("plans/overdue") @Permissions(auditPermissions.planView) planOverdue(
    @CurrentUser() user: RequestUser,
    @Query() query: Record<string, any>,
  ) {
    return this.plans.register(user, { ...query, scheduleStatus: "Overdue" });
  }
  @Get("plans/draft") @Permissions(auditPermissions.planView) planDraft(
    @CurrentUser() user: RequestUser,
    @Query() query: Record<string, any>,
  ) {
    return this.plans.register(user, { ...query, planStatus: "Draft" });
  }
  @Get("plans/scheduled") @Permissions(auditPermissions.planView) planScheduled(
    @CurrentUser() user: RequestUser,
    @Query() query: Record<string, any>,
  ) {
    return this.plans.register(user, { ...query, planStatus: "Scheduled" });
  }
  @Get("plans/postponed") @Permissions(auditPermissions.planView) planPostponed(
    @CurrentUser() user: RequestUser,
    @Query() query: Record<string, any>,
  ) {
    return this.plans.register(user, { ...query, planStatus: "Postponed" });
  }
  @Get("plans/cancelled") @Permissions(auditPermissions.planView) planCancelled(
    @CurrentUser() user: RequestUser,
    @Query() query: Record<string, any>,
  ) {
    return this.plans.register(user, { ...query, planStatus: "Cancelled" });
  }
  @Get("plans/ready-for-checklist")
  @Permissions(auditPermissions.planView)
  planReady(
    @CurrentUser() user: RequestUser,
    @Query() query: Record<string, any>,
  ) {
    return this.plans.register(user, {
      ...query,
      readinessHealth: "Ready For Checklist",
    });
  }
  @Get("plans/missing-configuration")
  @Permissions(auditPermissions.planView)
  async planMissing(
    @CurrentUser() user: RequestUser,
    @Query() query: Record<string, any>,
  ) {
    const result = await this.plans.register(user, {
      ...query,
      page: 1,
      limit: 100,
    });
    return {
      ...result,
      rows: result.rows.filter((row) => !row.ready_for_checklist),
    };
  }
  @Get("plans/conflicts")
  @Permissions(auditPermissions.planConflictView)
  async planConflicts(
    @CurrentUser() user: RequestUser,
    @Query() query: Record<string, any>,
  ) {
    const result = await this.plans.register(user, {
      ...query,
      page: 1,
      limit: 100,
    });
    return {
      ...result,
      rows: result.rows.filter((row) => row.conflict_status !== "No Conflict"),
    };
  }
  @Get("plans/generation-jobs")
  @Permissions(auditPermissions.planGenerateFromProgram)
  generationJobs(@CurrentUser() user: RequestUser) {
    return this.plans.generationJobs(user);
  }
  @Get("plans/generation-jobs/:jobId")
  @Permissions(auditPermissions.planGenerateFromProgram)
  generationJob(
    @CurrentUser() user: RequestUser,
    @Param("jobId") jobId: string,
  ) {
    return this.plans.generationJob(user, jobId);
  }
  @Post("plans/generate-from-program")
  @Permissions(auditPermissions.planGenerateFromProgram)
  generatePlan(
    @CurrentUser() user: RequestUser,
    @Body() dto: Record<string, any>,
  ) {
    return this.plans.generateFromProgram(user, dto.programId, dto);
  }
  @Get("plans") @Permissions(auditPermissions.planView) planRegister(
    @CurrentUser() user: RequestUser,
    @Query() query: Record<string, any>,
  ) {
    return this.plans.register(user, query);
  }
  @Post("plans") @Permissions(auditPermissions.planCreate) createPlan(
    @CurrentUser() user: RequestUser,
    @Body() dto: Record<string, any>,
  ) {
    return this.plans.create(user, dto);
  }
  @Get("plans/:planId") @Permissions(auditPermissions.planView) planDetail(
    @CurrentUser() user: RequestUser,
    @Param("planId") planId: string,
  ) {
    return this.plans.detail(user, planId);
  }
  @Patch("plans/:planId") @Permissions(auditPermissions.planEdit) patchPlan(
    @CurrentUser() user: RequestUser,
    @Param("planId") planId: string,
    @Body() dto: Record<string, any>,
  ) {
    return this.plans.update(user, planId, dto);
  }
  @Post("plans/:planId/schedule")
  @Permissions(auditPermissions.planSchedule)
  schedulePlan(
    @CurrentUser() user: RequestUser,
    @Param("planId") planId: string,
  ) {
    return this.plans.transition(user, planId, "schedule");
  }
  @Post("plans/:planId/reschedule")
  @Permissions(auditPermissions.planReschedule)
  reschedulePlan(
    @CurrentUser() user: RequestUser,
    @Param("planId") planId: string,
    @Body() dto: Record<string, any>,
  ) {
    return this.plans.transition(user, planId, "reschedule", dto);
  }
  @Post("plans/:planId/postpone")
  @Permissions(auditPermissions.planPostpone)
  postponePlan(
    @CurrentUser() user: RequestUser,
    @Param("planId") planId: string,
    @Body() dto: Record<string, any>,
  ) {
    return this.plans.transition(user, planId, "postpone", dto);
  }
  @Post("plans/:planId/cancel")
  @Permissions(auditPermissions.planCancel)
  cancelPlan(
    @CurrentUser() user: RequestUser,
    @Param("planId") planId: string,
    @Body() dto: Record<string, any>,
  ) {
    return this.plans.transition(user, planId, "cancel", dto);
  }
  @Post("plans/:planId/archive")
  @Permissions(auditPermissions.planArchive)
  archivePlan(
    @CurrentUser() user: RequestUser,
    @Param("planId") planId: string,
    @Body() dto: Record<string, any>,
  ) {
    return this.plans.transition(user, planId, "archive", dto);
  }
  @Post("plans/:planId/reactivate")
  @Permissions(auditPermissions.planReactivate)
  reactivatePlan(
    @CurrentUser() user: RequestUser,
    @Param("planId") planId: string,
  ) {
    return this.plans.transition(user, planId, "reactivate");
  }
  @Post("plans/:planId/submit-review")
  @Permissions(auditPermissions.planSubmitReview)
  submitPlanReview(
    @CurrentUser() user: RequestUser,
    @Param("planId") planId: string,
  ) {
    return this.plans.transition(user, planId, "submit-review");
  }
  @Post("plans/:planId/review/approve")
  @Permissions(auditPermissions.planReview)
  approvePlan(
    @CurrentUser() user: RequestUser,
    @Param("planId") planId: string,
    @Body() dto: Record<string, any>,
  ) {
    return this.plans.reviewDecision(user, planId, "approve", dto);
  }
  @Post("plans/:planId/review/reject")
  @Permissions(auditPermissions.planReview)
  rejectPlan(
    @CurrentUser() user: RequestUser,
    @Param("planId") planId: string,
    @Body() dto: Record<string, any>,
  ) {
    return this.plans.reviewDecision(user, planId, "reject", dto);
  }
  @Get("plans/:planId/readiness")
  @Permissions(auditPermissions.planView)
  planReadiness(
    @CurrentUser() user: RequestUser,
    @Param("planId") planId: string,
  ) {
    return this.plans.readinessFor(user, planId);
  }
  @Post("plans/:planId/readiness/run")
  @Permissions(auditPermissions.planReadinessRun)
  runPlanReadiness(
    @CurrentUser() user: RequestUser,
    @Param("planId") planId: string,
  ) {
    return this.plans.readinessFor(user, planId, true);
  }
  @Post("plans/:planId/calculate-readiness")
  @Permissions(auditPermissions.planReadinessRun)
  calculatePlanReadiness(
    @CurrentUser() user: RequestUser,
    @Param("planId") planId: string,
  ) {
    return this.plans.readinessFor(user, planId, true);
  }
  @Get("plans/:planId/conflicts")
  @Permissions(auditPermissions.planConflictView)
  getPlanConflicts(
    @CurrentUser() user: RequestUser,
    @Param("planId") planId: string,
  ) {
    return this.plans.conflictsFor(user, planId);
  }
  @Post("plans/:planId/conflicts/detect")
  @Permissions(auditPermissions.planConflictView)
  detectPlanConflicts(
    @CurrentUser() user: RequestUser,
    @Param("planId") planId: string,
  ) {
    return this.plans.conflictsFor(user, planId, true);
  }
  @Post("plans/:planId/conflicts/:conflictId/resolve")
  @Permissions(auditPermissions.planEdit)
  resolvePlanConflict(
    @CurrentUser() user: RequestUser,
    @Param("planId") planId: string,
    @Param("conflictId") conflictId: string,
    @Body() dto: Record<string, any>,
  ) {
    return this.plans.resolveConflict(user, planId, conflictId, dto);
  }
  @Post("plans/:planId/conflicts/:conflictId/override")
  @Permissions(auditPermissions.planConflictOverride)
  overridePlanConflict(
    @CurrentUser() user: RequestUser,
    @Param("planId") planId: string,
    @Param("conflictId") conflictId: string,
    @Body() dto: Record<string, any>,
  ) {
    return this.plans.resolveConflict(user, planId, conflictId, dto, true);
  }
  @Get("plans/:planId/history")
  @Permissions(auditPermissions.planHistoryView)
  onePlanHistory(
    @CurrentUser() user: RequestUser,
    @Param("planId") planId: string,
  ) {
    return this.plans.historyRows(user, planId);
  }
  @Get("plans/:planId/scopes")
  @Permissions(auditPermissions.planView)
  getPlanScopes(
    @CurrentUser() user: RequestUser,
    @Param("planId") planId: string,
  ) {
    return this.plans.childRows(user, planId, "scope");
  }
  @Post("plans/:planId/scopes")
  @Permissions(auditPermissions.planScopeManage)
  addPlanScope(
    @CurrentUser() user: RequestUser,
    @Param("planId") planId: string,
    @Body() dto: Record<string, any>,
  ) {
    return this.plans.saveChild(user, planId, "scope", dto);
  }
  @Patch("plans/:planId/scopes/:sectionId")
  @Permissions(auditPermissions.planScopeManage)
  patchPlanScope(
    @CurrentUser() user: RequestUser,
    @Param("planId") planId: string,
    @Param("sectionId") sectionId: string,
    @Body() dto: Record<string, any>,
  ) {
    return this.plans.saveChild(user, planId, "scope", dto, sectionId);
  }
  @Delete("plans/:planId/scopes/:sectionId")
  @Permissions(auditPermissions.planScopeManage)
  deletePlanScope(
    @CurrentUser() user: RequestUser,
    @Param("planId") planId: string,
    @Param("sectionId") sectionId: string,
    @Body() dto: Record<string, any>,
  ) {
    return this.plans.deleteChild(user, planId, "scope", sectionId, dto);
  }
  @Post("plans/:planId/standards")
  @Permissions(auditPermissions.planStandardManage)
  addPlanStandard(
    @CurrentUser() user: RequestUser,
    @Param("planId") planId: string,
    @Body() dto: Record<string, any>,
  ) {
    return this.plans.saveChild(user, planId, "standards", dto);
  }
  @Patch("plans/:planId/standards/:sectionId")
  @Permissions(auditPermissions.planStandardManage)
  patchPlanStandard(
    @CurrentUser() user: RequestUser,
    @Param("planId") planId: string,
    @Param("sectionId") sectionId: string,
    @Body() dto: Record<string, any>,
  ) {
    return this.plans.saveChild(user, planId, "standards", dto, sectionId);
  }
  @Delete("plans/:planId/standards/:sectionId")
  @Permissions(auditPermissions.planStandardManage)
  deletePlanStandard(
    @CurrentUser() user: RequestUser,
    @Param("planId") planId: string,
    @Param("sectionId") sectionId: string,
    @Body() dto: Record<string, any>,
  ) {
    return this.plans.deleteChild(user, planId, "standards", sectionId, dto);
  }
  @Post("plans/:planId/modules")
  @Permissions(auditPermissions.planModuleManage)
  addPlanModule(
    @CurrentUser() user: RequestUser,
    @Param("planId") planId: string,
    @Body() dto: Record<string, any>,
  ) {
    return this.plans.saveChild(user, planId, "modules", dto);
  }
  @Patch("plans/:planId/modules/:sectionId")
  @Permissions(auditPermissions.planModuleManage)
  patchPlanModule(
    @CurrentUser() user: RequestUser,
    @Param("planId") planId: string,
    @Param("sectionId") sectionId: string,
    @Body() dto: Record<string, any>,
  ) {
    return this.plans.saveChild(user, planId, "modules", dto, sectionId);
  }
  @Delete("plans/:planId/modules/:sectionId")
  @Permissions(auditPermissions.planModuleManage)
  deletePlanModule(
    @CurrentUser() user: RequestUser,
    @Param("planId") planId: string,
    @Param("sectionId") sectionId: string,
    @Body() dto: Record<string, any>,
  ) {
    return this.plans.deleteChild(user, planId, "modules", sectionId, dto);
  }
  @Post("plans/:planId/team")
  @Permissions(auditPermissions.planTeamManage)
  addPlanTeam(
    @CurrentUser() user: RequestUser,
    @Param("planId") planId: string,
    @Body() dto: Record<string, any>,
  ) {
    return this.plans.saveChild(user, planId, "team", dto);
  }
  @Patch("plans/:planId/team/:sectionId")
  @Permissions(auditPermissions.planTeamManage)
  patchPlanTeam(
    @CurrentUser() user: RequestUser,
    @Param("planId") planId: string,
    @Param("sectionId") sectionId: string,
    @Body() dto: Record<string, any>,
  ) {
    return this.plans.saveChild(user, planId, "team", dto, sectionId);
  }
  @Delete("plans/:planId/team/:sectionId")
  @Permissions(auditPermissions.planTeamManage)
  deletePlanTeam(
    @CurrentUser() user: RequestUser,
    @Param("planId") planId: string,
    @Param("sectionId") sectionId: string,
    @Body() dto: Record<string, any>,
  ) {
    return this.plans.deleteChild(user, planId, "team", sectionId, dto);
  }
  @Get("plans/:planId/:section")
  @Permissions(auditPermissions.planView)
  planSection(
    @CurrentUser() user: RequestUser,
    @Param("planId") planId: string,
    @Param("section") section: string,
  ) {
    return this.plans.childRows(user, planId, section);
  }
  @Post("plans/:planId/:section")
  @Permissions(auditPermissions.planEdit)
  addPlanSection(
    @CurrentUser() user: RequestUser,
    @Param("planId") planId: string,
    @Param("section") section: string,
    @Body() dto: Record<string, any>,
  ) {
    return this.plans.saveChild(user, planId, section, dto);
  }
  @Patch("plans/:planId/:section/:sectionId")
  @Permissions(auditPermissions.planEdit)
  patchPlanSection(
    @CurrentUser() user: RequestUser,
    @Param("planId") planId: string,
    @Param("section") section: string,
    @Param("sectionId") sectionId: string,
    @Body() dto: Record<string, any>,
  ) {
    return this.plans.saveChild(user, planId, section, dto, sectionId);
  }
  @Delete("plans/:planId/:section/:sectionId")
  @Permissions(auditPermissions.planEdit)
  deletePlanSection(
    @CurrentUser() user: RequestUser,
    @Param("planId") planId: string,
    @Param("section") section: string,
    @Param("sectionId") sectionId: string,
    @Body() dto: Record<string, any>,
  ) {
    return this.plans.deleteChild(user, planId, section, sectionId, dto);
  }
  @Get("programs/:programId/plans")
  @Permissions(auditPermissions.planView)
  programPlans(
    @CurrentUser() user: RequestUser,
    @Param("programId") programId: string,
    @Query() query: Record<string, any>,
  ) {
    return this.plans.register(user, { ...query, programId });
  }
  @Post("programs/:programId/generate-plan")
  @Permissions(auditPermissions.planGenerateFromProgram)
  generateProgramPlan(
    @CurrentUser() user: RequestUser,
    @Param("programId") programId: string,
    @Body() dto: Record<string, any>,
  ) {
    return this.plans.generateFromProgram(user, programId, dto);
  }
  @Get("sites/:siteId/plans") @Permissions(auditPermissions.planView) sitePlans(
    @CurrentUser() user: RequestUser,
    @Param("siteId") siteId: string,
    @Query() query: Record<string, any>,
  ) {
    return this.plans.register(user, { ...query, siteId });
  }
  @Get("units/:unitId/plans") @Permissions(auditPermissions.planView) unitPlans(
    @CurrentUser() user: RequestUser,
    @Param("unitId") unitId: string,
    @Query() query: Record<string, any>,
  ) {
    return this.plans.scopedPlans(user, "unit_id", unitId, query);
  }
  @Get("areas/:areaId/plans") @Permissions(auditPermissions.planView) areaPlans(
    @CurrentUser() user: RequestUser,
    @Param("areaId") areaId: string,
    @Query() query: Record<string, any>,
  ) {
    return this.plans.scopedPlans(user, "area_id", areaId, query);
  }

  @Get("programs")
  @Permissions(auditPermissions.programView)
  register(
    @CurrentUser() user: RequestUser,
    @Query() query: Record<string, any>,
  ) {
    return this.programs.register(user, query);
  }

  @Get("programs/summary")
  @Permissions(auditPermissions.programView)
  registerSummary(
    @CurrentUser() user: RequestUser,
    @Query() query: Record<string, any>,
  ) {
    return this.programs.dashboardSummary(user, query);
  }

  @Post("programs")
  @Permissions(auditPermissions.programCreate)
  create(@CurrentUser() user: RequestUser, @Body() dto: Record<string, any>) {
    return this.programs.create(user, dto);
  }

  @Get("programs/:programId")
  @Permissions(auditPermissions.programView)
  detail(
    @CurrentUser() user: RequestUser,
    @Param("programId") programId: string,
  ) {
    return this.programs.detail(user, programId);
  }

  @Patch("programs/:programId")
  @Permissions(auditPermissions.programEdit)
  update(
    @CurrentUser() user: RequestUser,
    @Param("programId") programId: string,
    @Body() dto: Record<string, any>,
  ) {
    return this.programs.update(user, programId, dto);
  }

  @Post("programs/:programId/activate")
  @Permissions(auditPermissions.programActivate)
  activate(
    @CurrentUser() user: RequestUser,
    @Param("programId") programId: string,
  ) {
    return this.programs.activate(user, programId);
  }

  @Post("programs/:programId/archive")
  @Permissions(auditPermissions.programArchive)
  archive(
    @CurrentUser() user: RequestUser,
    @Param("programId") programId: string,
    @Body() dto: Record<string, any>,
  ) {
    return this.programs.archive(user, programId, dto);
  }

  @Post("programs/:programId/reactivate")
  @Permissions(auditPermissions.programReactivate)
  reactivate(
    @CurrentUser() user: RequestUser,
    @Param("programId") programId: string,
  ) {
    return this.programs.reactivate(user, programId);
  }

  @Post("programs/:programId/submit-review")
  @Permissions(auditPermissions.programSubmitReview)
  submitReview(
    @CurrentUser() user: RequestUser,
    @Param("programId") programId: string,
  ) {
    return this.programs.submitReview(user, programId);
  }

  @Post("programs/:programId/calculate-health")
  @Permissions(auditPermissions.programEdit)
  calculateHealth(
    @CurrentUser() user: RequestUser,
    @Param("programId") programId: string,
  ) {
    return this.programs.calculateHealth(user, programId);
  }

  @Get("programs/:programId/scope")
  @Permissions(auditPermissions.programView)
  scope(
    @CurrentUser() user: RequestUser,
    @Param("programId") programId: string,
  ) {
    return this.programs.scopeRows(user, programId);
  }

  @Post("programs/:programId/scope")
  @Permissions(auditPermissions.scopeManage)
  addScope(
    @CurrentUser() user: RequestUser,
    @Param("programId") programId: string,
    @Body() dto: Record<string, any>,
  ) {
    return this.programs.saveScope(user, programId, dto);
  }

  @Patch("programs/:programId/scope/:scopeId")
  @Permissions(auditPermissions.scopeManage)
  patchScope(
    @CurrentUser() user: RequestUser,
    @Param("programId") programId: string,
    @Param("scopeId") scopeId: string,
    @Body() dto: Record<string, any>,
  ) {
    return this.programs.saveScope(user, programId, dto, scopeId);
  }

  @Delete("programs/:programId/scope/:scopeId")
  @Permissions(auditPermissions.scopeManage)
  deleteScope(
    @CurrentUser() user: RequestUser,
    @Param("programId") programId: string,
    @Param("scopeId") scopeId: string,
    @Body() dto: Record<string, any>,
  ) {
    return this.programs.removeScope(user, programId, scopeId, dto);
  }

  @Get("programs/:programId/standards")
  @Permissions(auditPermissions.programView)
  standards(
    @CurrentUser() user: RequestUser,
    @Param("programId") programId: string,
  ) {
    return this.programs.standardRows(user, programId);
  }

  @Post("programs/:programId/standards")
  @Permissions(auditPermissions.standardManage)
  addStandard(
    @CurrentUser() user: RequestUser,
    @Param("programId") programId: string,
    @Body() dto: Record<string, any>,
  ) {
    return this.programs.saveStandard(user, programId, dto);
  }

  @Patch("programs/:programId/standards/:standardId")
  @Permissions(auditPermissions.standardManage)
  patchStandard(
    @CurrentUser() user: RequestUser,
    @Param("programId") programId: string,
    @Param("standardId") standardId: string,
    @Body() dto: Record<string, any>,
  ) {
    return this.programs.saveStandard(user, programId, dto, standardId);
  }

  @Delete("programs/:programId/standards/:standardId")
  @Permissions(auditPermissions.standardManage)
  deleteStandard(
    @CurrentUser() user: RequestUser,
    @Param("programId") programId: string,
    @Param("standardId") standardId: string,
    @Body() dto: Record<string, any>,
  ) {
    return this.programs.removeStandard(user, programId, standardId, dto);
  }

  @Get("programs/:programId/modules")
  @Permissions(auditPermissions.programView)
  modules(
    @CurrentUser() user: RequestUser,
    @Param("programId") programId: string,
  ) {
    return this.programs.moduleRows(user, programId);
  }

  @Post("programs/:programId/modules")
  @Permissions(auditPermissions.moduleManage)
  addModule(
    @CurrentUser() user: RequestUser,
    @Param("programId") programId: string,
    @Body() dto: Record<string, any>,
  ) {
    return this.programs.saveModule(user, programId, dto);
  }

  @Patch("programs/:programId/modules/:moduleId")
  @Permissions(auditPermissions.moduleManage)
  patchModule(
    @CurrentUser() user: RequestUser,
    @Param("programId") programId: string,
    @Param("moduleId") moduleId: string,
    @Body() dto: Record<string, any>,
  ) {
    return this.programs.saveModule(user, programId, dto, moduleId);
  }

  @Delete("programs/:programId/modules/:moduleId")
  @Permissions(auditPermissions.moduleManage)
  deleteModule(
    @CurrentUser() user: RequestUser,
    @Param("programId") programId: string,
    @Param("moduleId") moduleId: string,
    @Body() dto: Record<string, any>,
  ) {
    return this.programs.removeModule(user, programId, moduleId, dto);
  }

  @Get("programs/:programId/frequency")
  @Permissions(auditPermissions.programView)
  frequency(
    @CurrentUser() user: RequestUser,
    @Param("programId") programId: string,
  ) {
    return this.programs.frequency(user, programId);
  }

  @Patch("programs/:programId/frequency")
  @Permissions(auditPermissions.frequencyManage)
  patchFrequency(
    @CurrentUser() user: RequestUser,
    @Param("programId") programId: string,
    @Body() dto: Record<string, any>,
  ) {
    return this.programs.saveFrequency(user, programId, dto);
  }

  @Get("programs/:programId/integration-settings")
  @Permissions(auditPermissions.programView)
  integrationSettings(
    @CurrentUser() user: RequestUser,
    @Param("programId") programId: string,
  ) {
    return this.programs.integrationSettings(user, programId);
  }

  @Patch("programs/:programId/integration-settings")
  @Permissions(auditPermissions.integrationManage)
  patchIntegrationSettings(
    @CurrentUser() user: RequestUser,
    @Param("programId") programId: string,
    @Body() dto: Record<string, any>,
  ) {
    return this.programs.saveIntegrationSettings(user, programId, dto);
  }

  @Get("history")
  @Permissions(auditPermissions.historyView)
  history(
    @CurrentUser() user: RequestUser,
    @Query() query: Record<string, any>,
  ) {
    return this.programs.historyRows(user, query);
  }

  @Get("programs/:programId/history")
  @Permissions(auditPermissions.historyView)
  programHistory(
    @CurrentUser() user: RequestUser,
    @Param("programId") programId: string,
    @Query() query: Record<string, any>,
  ) {
    return this.programs.historyRows(user, { ...query, programId });
  }

  @Get("settings")
  @Permissions(auditPermissions.settingsView)
  settings(@CurrentUser() user: RequestUser, @Query("siteId") siteId?: string) {
    return this.settingsService.get(user, siteId ?? null);
  }

  @Get("settings/summary")
  @Permissions(auditPermissions.settingsSummaryView)
  settingsSummary(@CurrentUser() user: RequestUser) {
    return this.settingsService.summary(user);
  }

  @Patch("settings")
  @Permissions(auditPermissions.settingsEdit)
  patchSettings(
    @CurrentUser() user: RequestUser,
    @Body() dto: Record<string, any>,
  ) {
    return this.settingsService.update(user, dto);
  }

  @Get("context")
  @Permissions(auditPermissions.programView)
  context(@CurrentUser() user: RequestUser) {
    return this.programs.context(user);
  }

  @Get("lookups/audit-types")
  @Permissions(auditPermissions.programView)
  auditTypes() {
    return this.lookups.byName("auditTypes");
  }
  @Get("lookups/program-categories")
  @Permissions(auditPermissions.programView)
  categories() {
    return this.lookups.byName("programCategories");
  }
  @Get("lookups/program-statuses")
  @Permissions(auditPermissions.programView)
  statuses() {
    return this.lookups.byName("programStatuses");
  }
  @Get("lookups/configuration-health-statuses")
  @Permissions(auditPermissions.programView)
  healthStatuses() {
    return this.lookups.byName("configurationHealthStatuses");
  }
  @Get("lookups/criticality-levels")
  @Permissions(auditPermissions.programView)
  criticality() {
    return this.lookups.byName("criticalityLevels");
  }
  @Get("lookups/scope-types")
  @Permissions(auditPermissions.programView)
  scopeTypes() {
    return this.lookups.byName("scopeTypes");
  }
  @Get("lookups/audit-frequencies")
  @Permissions(auditPermissions.programView)
  frequencies() {
    return this.lookups.byName("auditFrequencies");
  }
  @Get("lookups/coverage-levels")
  @Permissions(auditPermissions.programView)
  coverageLevels() {
    return this.lookups.byName("coverageLevels");
  }
  @Get("lookups/auditable-modules")
  @Permissions(auditPermissions.programView)
  auditableModules() {
    return this.lookups.byName("auditableModules");
  }
  @Get("lookups/standard-options")
  @Permissions(auditPermissions.programView)
  standardOptions() {
    return this.lookups.byName("standardOptions");
  }

  @Get("sites/:siteId/programs")
  @Permissions(auditPermissions.programView)
  sitePrograms(
    @CurrentUser() user: RequestUser,
    @Param("siteId") siteId: string,
    @Query() query: Record<string, any>,
  ) {
    return this.programs.scopedProgramsForRoute(user, { ...query, siteId });
  }

  @Get("units/:unitId/programs")
  @Permissions(auditPermissions.programView)
  unitPrograms(
    @CurrentUser() user: RequestUser,
    @Param("unitId") unitId: string,
    @Query() query: Record<string, any>,
  ) {
    return this.programs.scopedProgramsForRoute(user, { ...query, unitId });
  }

  @Get("areas/:areaId/programs")
  @Permissions(auditPermissions.programView)
  areaPrograms(
    @CurrentUser() user: RequestUser,
    @Param("areaId") areaId: string,
    @Query() query: Record<string, any>,
  ) {
    return this.programs.scopedProgramsForRoute(user, { ...query, areaId });
  }
}
