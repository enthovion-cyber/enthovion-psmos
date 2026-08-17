import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { ActionsModule } from '../actions/actions.module';
import { SupabaseModule } from '../database/supabase.module';
import { DocumentsModule } from '../documents/documents.module';
import { EquipmentModule } from '../equipment/equipment.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { PermissionsModule } from '../permissions/permissions.module';
import { SearchModule } from '../search/search.module';
import { SignaturesModule } from '../signatures/signatures.module';
import { TenantsModule } from '../tenants/tenants.module';
import { WorkflowsModule } from '../workflows/workflows.module';
import { MechanicalIntegrityController } from './mechanical-integrity.controller';
import { MechanicalIntegritySafeguardsController } from './mechanical-integrity-safeguards.controller';
import { MechanicalIntegrityService } from './mechanical-integrity.service';
import { MiDeficiencyController, MiDeficiencyScopedController, MiDeviationController } from './mi-deficiency.controller';
import { MiDeficiencyService } from './mi-deficiency.service';
import { MiSafeguardImpairmentController, MiSafeguardImpairmentScopedController } from './mi-safeguard-impairment.controller';
import { MiSafeguardImpairmentService } from './mi-safeguard-impairment.service';
import { MiWorkOrderController, MiWorkOrderScopedController } from './mi-work-order.controller';
import { MiWorkOrderService } from './mi-work-order.service';
import { MiReadinessController, MiReadinessScopedController } from './mi-readiness.controller';
import { MiReadinessService } from './mi-readiness.service';
import { MiLinkedRecordsDocumentsController } from './mi-linked-records-documents.controller';
import { MiLinkedRecordsDocumentsService } from './mi-linked-records-documents.service';
import { MiReviewApprovalController, MiReviewApprovalLookupsController } from './mi-review-approval.controller';
import { MiReviewApprovalService } from './mi-review-approval.service';
import { MiHistoryReportingController, MiHistoryReportingLookupsController } from './mi-history-reporting.controller';
import { MiHistoryReportingService } from './mi-history-reporting.service';

@Module({
  imports: [SupabaseModule, EquipmentModule, DocumentsModule, AuditModule, ActionsModule, NotificationsModule, PermissionsModule, SearchModule, SignaturesModule, TenantsModule, WorkflowsModule],
  controllers: [
    MechanicalIntegrityController,
    MechanicalIntegritySafeguardsController,
    MiSafeguardImpairmentController,
    MiSafeguardImpairmentScopedController,
    MiDeficiencyController,
    MiDeviationController,
    MiDeficiencyScopedController,
    MiWorkOrderController,
    MiWorkOrderScopedController,
    MiReadinessController,
    MiReadinessScopedController,
    MiLinkedRecordsDocumentsController,
    MiReviewApprovalController,
    MiReviewApprovalLookupsController,
    MiHistoryReportingController,
    MiHistoryReportingLookupsController
  ],
  providers: [MechanicalIntegrityService, MiSafeguardImpairmentService, MiDeficiencyService, MiWorkOrderService, MiReadinessService, MiLinkedRecordsDocumentsService, MiReviewApprovalService, MiHistoryReportingService],
  exports: [MechanicalIntegrityService, MiSafeguardImpairmentService, MiDeficiencyService, MiWorkOrderService, MiReadinessService, MiLinkedRecordsDocumentsService, MiReviewApprovalService, MiHistoryReportingService]
})
export class MechanicalIntegrityModule {}
