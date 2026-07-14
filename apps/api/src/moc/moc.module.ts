import { Module } from '@nestjs/common';
import { ActionsModule } from '../actions/actions.module';
import { AuditModule } from '../audit/audit.module';
import { SupabaseModule } from '../database/supabase.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { PermissionsModule } from '../permissions/permissions.module';
import { SearchModule } from '../search/search.module';
import { TenantsModule } from '../tenants/tenants.module';
import { WorkflowsModule } from '../workflows/workflows.module';
import { PssrModule } from '../pssr/pssr.module';
import { MocController } from './moc.controller';
import { MocClosureBlockerService } from './moc-closure-blocker.service';
import { MocClosedLoopActionService } from './moc-closed-loop-action.service';
import { MocClosureChecklistService } from './moc-closure-checklist.service';
import { MocAttachmentsService } from './moc-attachments.service';
import { MocCommunicationTrainingService } from './moc-communication-training.service';
import { MocDashboardService } from './moc-dashboard.service';
import { MocEngineeringPackageService } from './moc-engineering-package.service';
import { MocEngineeringRequirementService } from './moc-engineering-requirement.service';
import { MocHistoryService } from './moc-history.service';
import { MocImpactActionGeneratorService } from './moc-impact-action-generator.service';
import { MocImpactAnswerService } from './moc-impact-answer.service';
import { MocImpactAssessmentService } from './moc-impact-assessment.service';
import { MocImpactValidationService } from './moc-impact-validation.service';
import { MocRiskCalculatorService } from './moc-risk-calculator.service';
import { MocRiskHistoryService } from './moc-risk-history.service';
import { MocRiskReviewRequirementService } from './moc-risk-review-requirement.service';
import { MocRiskService } from './moc-risk.service';
import { MocRiskValidationService } from './moc-risk-validation.service';
import { MocRiskWorkflowImpactService } from './moc-risk-workflow-impact.service';
import { MocStartupReadinessService } from './moc-startup-readiness.service';
import { MocStartupBlockerService } from './moc-startup-blocker.service';
import { MocTemporaryEmergencyService } from './moc-temporary-emergency.service';
import { MocWorkflowService } from './moc-workflow.service';
import { MocService } from './moc.service';

@Module({
  imports: [SupabaseModule, AuditModule, NotificationsModule, PermissionsModule, SearchModule, TenantsModule, WorkflowsModule, ActionsModule, PssrModule],
  controllers: [MocController],
  providers: [MocService, MocDashboardService, MocImpactAssessmentService, MocImpactAnswerService, MocImpactActionGeneratorService, MocImpactValidationService, MocStartupBlockerService, MocClosureBlockerService, MocRiskService, MocRiskCalculatorService, MocRiskValidationService, MocRiskWorkflowImpactService, MocRiskReviewRequirementService, MocRiskHistoryService, MocEngineeringPackageService, MocEngineeringRequirementService, MocClosedLoopActionService, MocClosureChecklistService, MocWorkflowService, MocTemporaryEmergencyService, MocStartupReadinessService, MocCommunicationTrainingService, MocHistoryService, MocAttachmentsService],
  exports: [MocService, MocDashboardService, MocImpactAssessmentService, MocRiskService, MocEngineeringPackageService, MocClosedLoopActionService, MocWorkflowService, MocTemporaryEmergencyService, MocStartupReadinessService, MocCommunicationTrainingService, MocHistoryService, MocAttachmentsService]
})
export class MocModule {}
