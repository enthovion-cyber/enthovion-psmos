import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { SupabaseModule } from '../database/supabase.module';
import { PermissionsModule } from '../permissions/permissions.module';
import { TenantsModule } from '../tenants/tenants.module';
import { ActionsModule } from '../actions/actions.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { WorkflowsModule } from '../workflows/workflows.module';
import { ExecutiveController } from './executive.controller';
import { ExecutiveAdapterRegistryService } from './executive-adapter-registry.service';
import { ExecutiveAggregationService } from './executive-aggregation.service';
import { ExecutiveDashboardService } from './executive-dashboard.service';
import { ExecutivePerformanceService } from './executive-performance.service';
import { ExecutivePsmElementService } from './executive-psm-element.service';
import { ExecutiveCriticalRiskService } from './executive-critical-risk.service';
import { ExecutiveManagementReviewService } from './executive-management-review.service';
import { ExecutiveTrendsService } from './executive-trends.service';
import { ExecutiveReportsService } from './executive-reports.service';

// Modular Phase 3 performance services
import { ExecutivePerformanceDashboardService } from './executive-performance-dashboard.service';
import { ExecutiveCompanyPerformanceService } from './executive-company-performance.service';
import { ExecutiveSitePerformanceService } from './executive-site-performance.service';
import { ExecutiveDepartmentPerformanceService } from './executive-department-performance.service';
import { ExecutiveUnitPerformanceService } from './executive-unit-performance.service';
import { ExecutiveAreaPerformanceService } from './executive-area-performance.service';
import { ExecutiveEquipmentPerformanceService } from './executive-equipment-performance.service';
import { ExecutiveScopePerformanceCalculationService } from './executive-scope-performance-calculation.service';
import { ExecutiveScopeModuleScorecardService } from './executive-scope-module-scorecard.service';
import { ExecutiveScopeKpiScorecardService } from './executive-scope-kpi-scorecard.service';
import { ExecutivePerformanceComparisonService } from './executive-performance-comparison.service';
import { ExecutivePerformanceRankingService } from './executive-performance-ranking.service';
import { ExecutivePerformanceHeatmapService } from './executive-performance-heatmap.service';
import { ExecutivePerformanceDrilldownService } from './executive-performance-drilldown.service';
import { ExecutivePerformanceSourceTraceService } from './executive-performance-source-trace.service';
import { ExecutivePerformanceSnapshotService } from './executive-performance-snapshot.service';
import { ExecutivePerformancePermissionService } from './executive-performance-permission.service';
import { ExecutivePerformanceTenantScopeService } from './executive-performance-tenant-scope.service';
import { ExecutivePerformanceHistoryService } from './executive-performance-history.service';
import { ExecutivePerformanceAuditService } from './executive-performance-audit.service';
import { ExecutivePerformanceSettingsService } from './executive-performance-settings.service';
import { ExecutivePerformanceLookupService } from './executive-performance-lookup.service';

// Modular Phase 4 PSM element services
import { ExecutivePsmElementDashboardService } from './executive-psm-element-dashboard.service';
import { ExecutivePsmElementRegistryService } from './executive-psm-element-registry.service';
import { ExecutivePsmElementMappingService } from './executive-psm-element-mapping.service';
import { ExecutivePsmElementKpiMappingService } from './executive-psm-element-kpi-mapping.service';
import { ExecutivePsmElementScoringService } from './executive-psm-element-scoring.service';
import { ExecutivePsmElementScoreFactorService } from './executive-psm-element-score-factor.service';
import { ExecutivePsmElementScoreStatusService } from './executive-psm-element-score-status.service';
import { ExecutivePsmElementSourceTraceService } from './executive-psm-element-source-trace.service';
import { ExecutivePsmElementGapService } from './executive-psm-element-gap.service';
import { ExecutivePsmElementBlockerService } from './executive-psm-element-blocker.service';
import { ExecutivePsmElementHeatmapService } from './executive-psm-element-heatmap.service';
import { ExecutivePsmElementSiteBreakdownService } from './executive-psm-element-site-breakdown.service';
import { ExecutivePsmElementUnitBreakdownService } from './executive-psm-element-unit-breakdown.service';
import { ExecutivePsmElementSnapshotService } from './executive-psm-element-snapshot.service';
import { ExecutivePsmElementPermissionService } from './executive-psm-element-permission.service';
import { ExecutivePsmElementTenantScopeService } from './executive-psm-element-tenant-scope.service';
import { ExecutivePsmElementHistoryService } from './executive-psm-element-history.service';
import { ExecutivePsmElementAuditService } from './executive-psm-element-audit.service';
import { ExecutivePsmElementSettingsService } from './executive-psm-element-settings.service';
import { ExecutivePsmElementLookupService } from './executive-psm-element-lookup.service';

const modularPerformanceServices = [
  ExecutivePerformanceDashboardService,
  ExecutiveCompanyPerformanceService,
  ExecutiveSitePerformanceService,
  ExecutiveDepartmentPerformanceService,
  ExecutiveUnitPerformanceService,
  ExecutiveAreaPerformanceService,
  ExecutiveEquipmentPerformanceService,
  ExecutiveScopePerformanceCalculationService,
  ExecutiveScopeModuleScorecardService,
  ExecutiveScopeKpiScorecardService,
  ExecutivePerformanceComparisonService,
  ExecutivePerformanceRankingService,
  ExecutivePerformanceHeatmapService,
  ExecutivePerformanceDrilldownService,
  ExecutivePerformanceSourceTraceService,
  ExecutivePerformanceSnapshotService,
  ExecutivePerformancePermissionService,
  ExecutivePerformanceTenantScopeService,
  ExecutivePerformanceHistoryService,
  ExecutivePerformanceAuditService,
  ExecutivePerformanceSettingsService,
  ExecutivePerformanceLookupService,
];

const modularPsmElementServices = [
  ExecutivePsmElementDashboardService,
  ExecutivePsmElementRegistryService,
  ExecutivePsmElementMappingService,
  ExecutivePsmElementKpiMappingService,
  ExecutivePsmElementScoringService,
  ExecutivePsmElementScoreFactorService,
  ExecutivePsmElementScoreStatusService,
  ExecutivePsmElementSourceTraceService,
  ExecutivePsmElementGapService,
  ExecutivePsmElementBlockerService,
  ExecutivePsmElementHeatmapService,
  ExecutivePsmElementSiteBreakdownService,
  ExecutivePsmElementUnitBreakdownService,
  ExecutivePsmElementSnapshotService,
  ExecutivePsmElementPermissionService,
  ExecutivePsmElementTenantScopeService,
  ExecutivePsmElementHistoryService,
  ExecutivePsmElementAuditService,
  ExecutivePsmElementSettingsService,
  ExecutivePsmElementLookupService,
];

@Module({
  imports: [
    SupabaseModule,
    AuditModule,
    PermissionsModule,
    TenantsModule,
    ActionsModule,
    NotificationsModule,
    WorkflowsModule,
  ],
  controllers: [ExecutiveController],
  providers: [
    ExecutiveDashboardService,
    ExecutiveAdapterRegistryService,
    ExecutiveAggregationService,
    ExecutivePerformanceService,
    ExecutivePsmElementService,
    ExecutiveCriticalRiskService,
    ExecutiveManagementReviewService,
    ExecutiveTrendsService,
    ExecutiveReportsService,
    ...modularPerformanceServices,
    ...modularPsmElementServices,
  ],
  exports: [
    ExecutiveDashboardService,
    ExecutiveAggregationService,
    ExecutivePerformanceService,
    ExecutivePsmElementService,
    ExecutiveCriticalRiskService,
    ExecutiveManagementReviewService,
    ExecutiveTrendsService,
    ExecutiveReportsService,
    ...modularPerformanceServices,
    ...modularPsmElementServices,
  ],
})
export class ExecutiveModule {}
