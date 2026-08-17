import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { SupabaseModule } from '../database/supabase.module';
import { PermissionsModule } from '../permissions/permissions.module';
import { TenantsModule } from '../tenants/tenants.module';
import { TrainingCompetencyController } from './training-competency.controller';
import { TrainingCertAssessmentService } from './training-cert-assessment.service';
import { TrainingCompetencyService } from './training-competency.service';
import { TrainingMatrixService } from './training-matrix.service';
import { TrainingRecordsAttendanceService } from './training-records-attendance.service';
import { TrainingRequiredLibraryService } from './training-required-library.service';
import { MocTrainingController } from './moc-training.controller';
import { TrainingMocRequirementService } from './training-moc-requirement.service';
import { PssrTrainingController } from './pssr-training.controller';
import { TrainingPssrReadinessService } from './training-pssr-readiness.service';
import { PtwAuthorizationIntegrationController, TrainingPtwAuthorizationController } from './training-ptw-authorization.controller';
import { TrainingPtwAuthorizationService } from './training-ptw-authorization.service';
import { MocTrainingEvidencePackageController, PssrTrainingEvidencePackageController, PtwTrainingEvidencePackageController, TrainingReportsController } from './training-reports.controller';
import { TrainingReportsService } from './training-reports.service';
import { TrainingReviewApprovalController } from './training-review-approval.controller';
import { TrainingReviewApprovalService } from './training-review-approval.service';
import { TrainingFinalIntegrationController } from './training-final-integration.controller';
import { TrainingFinalIntegrationService } from './training-final-integration.service';
import { TrainingComplianceEngineService } from './training-compliance-engine.service';
import { TrainingComplianceSnapshotService } from './training-compliance-snapshot.service';
import { TrainingIntegrationHealthService } from './training-integration-health.service';
import { TrainingDataQualityService } from './training-data-quality.service';
import { TrainingCrossModuleSyncService } from './training-cross-module-sync.service';
import { TrainingEventListenerService } from './training-event-listener.service';
import { TrainingExpiryRecalculationService } from './training-expiry-recalculation.service';
import { TrainingGapReconciliationService } from './training-gap-reconciliation.service';
import { TrainingBlockerReconciliationService } from './training-blocker-reconciliation.service';
import { TrainingDashboardAggregationService } from './training-dashboard-aggregation.service';
import { TrainingPermissionAuditService } from './training-permission-audit.service';
import { TrainingRlsAuditService } from './training-rls-audit.service';
import { TrainingRouteHealthService } from './training-route-health.service';
import { TrainingProductionHardeningService } from './training-production-hardening.service';
import { TrainingFinalReportService } from './training-final-report.service';
import { TrainingFinalHistoryService } from './training-final-history.service';
import { TrainingFinalAuditService } from './training-final-audit.service';
import { TrainingRolesCompetencyService } from './training-roles-competency.service';
import { TrainingSopAcknowledgementService } from './training-sop-acknowledgement.service';

@Module({
  imports: [SupabaseModule, AuditModule, PermissionsModule, TenantsModule],
  controllers: [TrainingCompetencyController, MocTrainingController, PssrTrainingController, TrainingPtwAuthorizationController, PtwAuthorizationIntegrationController, TrainingReportsController, MocTrainingEvidencePackageController, PssrTrainingEvidencePackageController, PtwTrainingEvidencePackageController, TrainingReviewApprovalController, TrainingFinalIntegrationController],
  providers: [TrainingCompetencyService, TrainingCertAssessmentService, TrainingMatrixService, TrainingRolesCompetencyService, TrainingRequiredLibraryService, TrainingRecordsAttendanceService, TrainingSopAcknowledgementService, TrainingMocRequirementService, TrainingPssrReadinessService, TrainingPtwAuthorizationService, TrainingReportsService, TrainingReviewApprovalService, TrainingFinalIntegrationService, TrainingComplianceEngineService, TrainingComplianceSnapshotService, TrainingIntegrationHealthService, TrainingDataQualityService, TrainingCrossModuleSyncService, TrainingEventListenerService, TrainingExpiryRecalculationService, TrainingGapReconciliationService, TrainingBlockerReconciliationService, TrainingDashboardAggregationService, TrainingPermissionAuditService, TrainingRlsAuditService, TrainingRouteHealthService, TrainingProductionHardeningService, TrainingFinalReportService, TrainingFinalHistoryService, TrainingFinalAuditService],
  exports: [TrainingCompetencyService, TrainingCertAssessmentService, TrainingMatrixService, TrainingRolesCompetencyService, TrainingRequiredLibraryService, TrainingRecordsAttendanceService, TrainingSopAcknowledgementService, TrainingMocRequirementService, TrainingPssrReadinessService, TrainingPtwAuthorizationService, TrainingReportsService, TrainingReviewApprovalService, TrainingFinalIntegrationService, TrainingComplianceEngineService, TrainingComplianceSnapshotService, TrainingIntegrationHealthService, TrainingDataQualityService]
})
export class TrainingCompetencyModule {}
