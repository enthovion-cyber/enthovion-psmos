import { Module } from "@nestjs/common";
import { AuditModule } from "../audit/audit.module";
import { SupabaseModule } from "../database/supabase.module";
import { PermissionsModule } from "../permissions/permissions.module";
import { TenantsModule } from "../tenants/tenants.module";
import { ActionsModule } from "../actions/actions.module";
import { NotificationsModule } from "../notifications/notifications.module";
import { RegulatoryModule } from "../regulatory/regulatory.module";
import { AuditComplianceController } from "./audit-compliance.controller";
import { AuditDashboardService } from "./audit-dashboard.service";
import { AuditLookupService } from "./audit-lookup.service";
import { AuditPlanConflictService } from "./audit-plan-conflict.service";
import { AuditPlanHistoryService } from "./audit-plan-history.service";
import { AuditPlanReadinessService } from "./audit-plan-readiness.service";
import { AuditPlanService } from "./audit-plan.service";
import { AuditPlanSettingsService } from "./audit-plan-settings.service";
import { AuditPlanDashboardService } from "./audit-plan-dashboard.service";
import { AuditPlanCalendarService } from "./audit-plan-calendar.service";
import { AuditPlanCreateService } from "./audit-plan-create.service";
import { AuditPlanUpdateService } from "./audit-plan-update.service";
import { AuditPlanValidationService } from "./audit-plan-validation.service";
import { AuditPlanStatusService } from "./audit-plan-status.service";
import { AuditPlanScheduleService } from "./audit-plan-schedule.service";
import { AuditPlanRescheduleService } from "./audit-plan-reschedule.service";
import { AuditPlanGenerationService } from "./audit-plan-generation.service";
import { AuditPlanProgramSnapshotService } from "./audit-plan-program-snapshot.service";
import { AuditPlanScopeService } from "./audit-plan-scope.service";
import { AuditPlanStandardService } from "./audit-plan-standard.service";
import { AuditPlanModuleService } from "./audit-plan-module.service";
import { AuditPlanTeamService } from "./audit-plan-team.service";
import { AuditPlanReviewService } from "./audit-plan-review.service";
import { AuditPlanAuditService } from "./audit-plan-audit.service";
import { AuditPlanPermissionService } from "./audit-plan-permission.service";
import { AuditPlanTenantScopeService } from "./audit-plan-tenant-scope.service";
import { AuditPlanLookupService } from "./audit-plan-lookup.service";
import { AuditPlanProgramAdapterService } from "./audit-plan-program-adapter.service";
import { AuditPlanCompanySiteAdapterService } from "./audit-plan-company-site-adapter.service";
import { AuditPlanIamAdapterService } from "./audit-plan-iam-adapter.service";
import { AuditPlanCalendarAdapterService } from "./audit-plan-calendar-adapter.service";
import { AuditPlanReviewApprovalAdapterService } from "./audit-plan-review-approval-adapter.service";
import { AuditPlanNotificationAdapterService } from "./audit-plan-notification-adapter.service";
import { AuditPlanActionAdapterService } from "./audit-plan-action-adapter.service";
import { AuditPlanReportAdapterService } from "./audit-plan-report-adapter.service";
import { AuditPlanPtwAdapterService } from "./audit-plan-ptw-adapter.service";
import { AuditPlanMocAdapterService } from "./audit-plan-moc-adapter.service";
import { AuditPlanPssrAdapterService } from "./audit-plan-pssr-adapter.service";
import { AuditPlanTrainingAdapterService } from "./audit-plan-training-adapter.service";
import { AuditPlanMiAdapterService } from "./audit-plan-mi-adapter.service";
import { AuditPlanIncidentAdapterService } from "./audit-plan-incident-adapter.service";
import { AuditProgramHealthService } from "./audit-program-health.service";
import { AuditProgramHistoryService } from "./audit-program-history.service";
import { AuditProgramService } from "./audit-program.service";
import { AuditProgramStatusService } from "./audit-program-status.service";
import { AuditSettingsService } from "./audit-settings.service";
import { AuditChecklistService } from "./audit-checklist.service";
import { AuditChecklistHistoryService } from "./audit-checklist-history.service";
import { AuditChecklistNotificationAdapterService } from "./audit-checklist-notification-adapter.service";
import { AuditExecutionHistoryService } from "./audit-execution-history.service";
import { AuditExecutionService } from "./audit-execution.service";
import { AuditCapaHistoryService } from "./audit-capa-history.service";
import { AuditCapaService } from "./audit-capa.service";
import { AuditEvidenceHistoryService } from "./audit-evidence-history.service";
import { AuditEvidenceService } from "./audit-evidence.service";
import { AuditFindingHistoryService } from "./audit-finding-history.service";
import { AuditFindingService } from "./audit-finding.service";
import { AuditScoringHistoryService } from "./audit-scoring-history.service";
import { AuditScoringService } from "./audit-scoring.service";
import { AuditStandardHistoryService } from "./audit-standard-history.service";
import { AuditStandardMappingService } from "./audit-standard-mapping.service";
import { AuditReviewApprovalService } from "./audit-review-approval.service";
import { AuditReviewHistoryService } from "./audit-review-history.service";
import { AuditReportService } from "./audit-report.service";
import { AuditReportHistoryService } from "./audit-report-history.service";
import { AuditHistoryTrendService } from "./audit-history-trend.service";

@Module({
  imports: [
    SupabaseModule,
    AuditModule,
    PermissionsModule,
    TenantsModule,
    NotificationsModule,
    ActionsModule,
    RegulatoryModule,
  ],
  controllers: [AuditComplianceController],
  providers: [
    AuditChecklistService,
    AuditChecklistHistoryService,
    AuditChecklistNotificationAdapterService,
    AuditExecutionService,
    AuditExecutionHistoryService,
    AuditCapaService,
    AuditCapaHistoryService,
    AuditEvidenceService,
    AuditEvidenceHistoryService,
    AuditScoringService,
    AuditScoringHistoryService,
    AuditStandardMappingService,
    AuditStandardHistoryService,
    AuditReviewApprovalService,
    AuditReviewHistoryService,
    AuditReportService,
    AuditReportHistoryService,
    AuditHistoryTrendService,
    AuditFindingService,
    AuditFindingHistoryService,
    AuditDashboardService,
    AuditProgramService,
    AuditProgramHealthService,
    AuditProgramStatusService,
    AuditProgramHistoryService,
    AuditSettingsService,
    AuditLookupService,
    AuditPlanService,
    AuditPlanReadinessService,
    AuditPlanConflictService,
    AuditPlanHistoryService,
    AuditPlanSettingsService,
    AuditPlanDashboardService,
    AuditPlanCalendarService,
    AuditPlanCreateService,
    AuditPlanUpdateService,
    AuditPlanValidationService,
    AuditPlanStatusService,
    AuditPlanScheduleService,
    AuditPlanRescheduleService,
    AuditPlanGenerationService,
    AuditPlanProgramSnapshotService,
    AuditPlanScopeService,
    AuditPlanStandardService,
    AuditPlanModuleService,
    AuditPlanTeamService,
    AuditPlanReviewService,
    AuditPlanAuditService,
    AuditPlanPermissionService,
    AuditPlanTenantScopeService,
    AuditPlanLookupService,
    AuditPlanProgramAdapterService,
    AuditPlanCompanySiteAdapterService,
    AuditPlanIamAdapterService,
    AuditPlanCalendarAdapterService,
    AuditPlanReviewApprovalAdapterService,
    AuditPlanNotificationAdapterService,
    AuditPlanActionAdapterService,
    AuditPlanReportAdapterService,
    AuditPlanPtwAdapterService,
    AuditPlanMocAdapterService,
    AuditPlanPssrAdapterService,
    AuditPlanTrainingAdapterService,
    AuditPlanMiAdapterService,
    AuditPlanIncidentAdapterService,
  ],
  exports: [
    AuditChecklistService,
    AuditExecutionService,
    AuditCapaService,
    AuditEvidenceService,
    AuditScoringService,
    AuditStandardMappingService,
    AuditReviewApprovalService,
    AuditReportService,
    AuditHistoryTrendService,
    AuditFindingService,
    AuditDashboardService,
    AuditProgramService,
    AuditProgramHealthService,
    AuditProgramStatusService,
    AuditProgramHistoryService,
    AuditSettingsService,
    AuditLookupService,
    AuditPlanService,
    AuditPlanReadinessService,
    AuditPlanConflictService,
    AuditPlanHistoryService,
    AuditPlanSettingsService,
  ],
})
export class AuditComplianceModule {}
