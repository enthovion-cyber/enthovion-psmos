import { Injectable } from '@nestjs/common';
import { RequestUser } from '../common/decorators/current-user.decorator';
import { TrainingBlockerReconciliationService } from './training-blocker-reconciliation.service';
import { TrainingComplianceEngineService } from './training-compliance-engine.service';
import { TrainingComplianceSnapshotService } from './training-compliance-snapshot.service';
import { TrainingCrossModuleSyncService } from './training-cross-module-sync.service';
import { TrainingDashboardAggregationService } from './training-dashboard-aggregation.service';
import { TrainingDataQualityService } from './training-data-quality.service';
import { TrainingExpiryRecalculationService } from './training-expiry-recalculation.service';
import { TrainingFinalAuditService } from './training-final-audit.service';
import { TrainingFinalHistoryService } from './training-final-history.service';
import { TrainingFinalReportService } from './training-final-report.service';
import { TrainingIntegrationHealthService } from './training-integration-health.service';
import { TrainingPermissionAuditService } from './training-permission-audit.service';
import { TrainingProductionHardeningService } from './training-production-hardening.service';
import { TrainingRlsAuditService } from './training-rls-audit.service';
import { TrainingRouteHealthService } from './training-route-health.service';

type Row = Record<string, any>;

@Injectable()
export class TrainingFinalIntegrationService {
  constructor(
    private readonly dashboardAggregation: TrainingDashboardAggregationService,
    private readonly compliance: TrainingComplianceEngineService,
    private readonly snapshots: TrainingComplianceSnapshotService,
    private readonly health: TrainingIntegrationHealthService,
    private readonly dataQuality: TrainingDataQualityService,
    private readonly sync: TrainingCrossModuleSyncService,
    private readonly expiry: TrainingExpiryRecalculationService,
    private readonly blockers: TrainingBlockerReconciliationService,
    private readonly permissions: TrainingPermissionAuditService,
    private readonly rls: TrainingRlsAuditService,
    private readonly routes: TrainingRouteHealthService,
    private readonly hardening: TrainingProductionHardeningService,
    private readonly finalReport: TrainingFinalReportService,
    private readonly history: TrainingFinalHistoryService,
    private readonly audit: TrainingFinalAuditService
  ) {}

  async dashboard(user: RequestUser, query: Row = {}) {
    const [aggregation, snapshots, health, dataQuality, hardening, routes, permissions] = await Promise.all([
      this.dashboardAggregation.aggregate(user, query),
      this.snapshots.list(user, { ...query, limit: 10 }),
      this.health.list(user, { ...query, limit: 25 }),
      this.dataQuality.list(user, { ...query, limit: 25 }),
      this.hardening.checks(user, { ...query, limit: 25 }),
      Promise.resolve(this.routes.audit()),
      Promise.resolve(this.permissions.audit(user))
    ]);
    return {
      header: {
        title: 'Training Final Integration + Production Hardening',
        subtitle: 'Unified compliance, data quality, integration health, route health, RLS and production audit readiness.',
        lastUpdated: new Date().toISOString()
      },
      summary: {
        complianceScore: aggregation.compliance.complianceScore,
        complianceStatus: aggregation.compliance.complianceStatus,
        totalWorkers: aggregation.compliance.totalWorkers,
        safetyCriticalGaps: aggregation.compliance.safetyCriticalGapCount,
        openGaps: aggregation.compliance.openGapCount,
        overdue: aggregation.compliance.overdueCount,
        expired: aggregation.compliance.expiredCount,
        pendingApprovals: aggregation.compliance.pendingApprovalCount,
        dataQualityIssues: dataQuality.length,
        integrationWarnings: health.filter((row) => row.status !== 'Healthy').length,
        hardeningFailures: hardening.filter((row) => row.check_status === 'Failed').length,
        routeCount: routes.length,
        permissionGroupsCovered: permissions.filter((row) => row.status === 'Covered').length
      },
      compliance: aggregation.compliance,
      snapshots,
      integrationHealth: health,
      dataQualityIssues: dataQuality,
      hardeningChecks: hardening,
      routeHealth: routes,
      permissionAudit: permissions,
      generatedAt: new Date().toISOString()
    };
  }

  complianceSummary(user: RequestUser, query: Row = {}) { return this.compliance.calculateCompany(user, query); }
  workerCompliance(user: RequestUser, workerId: string) { return this.compliance.calculateWorker(user, workerId); }
  snapshotsList(user: RequestUser, query: Row = {}) { return this.snapshots.list(user, query); }
  recalculateSnapshots(user: RequestUser, dto: Row = {}) { return this.snapshots.recalculate(user, dto); }
  healthList(user: RequestUser, query: Row = {}) { return this.health.list(user, query); }
  runHealth(user: RequestUser, dto: Row = {}) { return this.health.run(user, dto); }
  dataQualityList(user: RequestUser, query: Row = {}) { return this.dataQuality.list(user, query); }
  runDataQuality(user: RequestUser, dto: Row = {}) { return this.dataQuality.run(user, dto); }
  syncEvents(user: RequestUser, query: Row = {}) { return this.sync.events(user, query); }
  recordSync(user: RequestUser, dto: Row = {}) { return this.sync.record(user, dto); }
  recalculateExpiry(user: RequestUser, dto: Row = {}) { return this.expiry.recalculate(user, dto); }
  reconcileGaps(user: RequestUser, query: Row = {}) { return this.compliance.calculateCompany(user, query); }
  reconcileBlockers(user: RequestUser, query: Row = {}) { return this.blockers.reconcile(user, query); }
  permissionAudit(user: RequestUser) { return this.permissions.audit(user); }
  rlsAudit() { return this.rls.audit(); }
  routeHealth() { return this.routes.audit(); }
  hardeningChecks(user: RequestUser, query: Row = {}) { return this.hardening.checks(user, query); }
  runHardening(user: RequestUser, dto: Row = {}) { return this.hardening.run(user, dto); }
  settings(user: RequestUser, query: Row = {}) { return this.hardening.settings(user, query); }
  updateSettings(user: RequestUser, dto: Row = {}) { return this.hardening.updateSettings(user, dto); }
  finalReportSummary(user: RequestUser, query: Row = {}) { return this.finalReport.generateIntegrationSummary(user, query); }
  finalHistory(user: RequestUser, query: Row = {}) { return this.history.history(user, query); }
  finalAudit(user: RequestUser) { return this.audit.audit(user); }
}
