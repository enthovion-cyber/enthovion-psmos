import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { SupabaseModule } from '../database/supabase.module';
import { PermissionsModule } from '../permissions/permissions.module';
import { TenantsModule } from '../tenants/tenants.module';
import { PsiController } from './psi.controller';
import { PsiService } from './psi.service';
import { PsiChemicalService } from './psi-chemical.service';
import { PsiCompletenessEngineService } from './psi-completeness-engine.service';
import { PsiDrawingService } from './psi-drawing.service';
import { PsiElectricalClassificationService } from './psi-electrical-classification.service';
import { PsiEquipmentDesignBasisService } from './psi-equipment-design-basis.service';
import { PsiMaterialCompatibilityService } from './psi-material-compatibility.service';
import { PsiIntegrationService } from './psi-integration.service';
import { PsiIntegrationSourceController } from './psi-integration-source.controller';
import { PsiReportController, PsiReportMechanicalIntegrityController, PsiReportSourceController } from './psi-report.controller';
import { PsiReportService } from './psi-report.service';
import { PsiProcessChemistryService } from './psi-process-chemistry.service';
import { PsiReliefSystemService } from './psi-relief-system.service';
import { PsiReviewApprovalController, PsiReviewApprovalEquipmentController, PsiReviewApprovalSourceController, PsiReviewApprovalUnitController } from './psi-review-approval.controller';
import { PsiReviewApprovalService } from './psi-review-approval.service';
import { PsiSafeguardService } from './psi-safeguard.service';
import { PsiSafeOperatingLimitService } from './psi-safe-operating-limit.service';

@Module({
  imports: [SupabaseModule, AuditModule, PermissionsModule, TenantsModule],
  controllers: [PsiController, PsiIntegrationSourceController, PsiReviewApprovalController, PsiReviewApprovalSourceController, PsiReviewApprovalUnitController, PsiReviewApprovalEquipmentController, PsiReportController, PsiReportSourceController, PsiReportMechanicalIntegrityController],
  providers: [PsiService, PsiChemicalService, PsiCompletenessEngineService, PsiProcessChemistryService, PsiSafeOperatingLimitService, PsiEquipmentDesignBasisService, PsiReliefSystemService, PsiDrawingService, PsiElectricalClassificationService, PsiMaterialCompatibilityService, PsiSafeguardService, PsiIntegrationService, PsiReviewApprovalService, PsiReportService],
  exports: [PsiService, PsiChemicalService, PsiCompletenessEngineService, PsiProcessChemistryService, PsiSafeOperatingLimitService, PsiEquipmentDesignBasisService, PsiReliefSystemService, PsiDrawingService, PsiElectricalClassificationService, PsiMaterialCompatibilityService, PsiSafeguardService, PsiIntegrationService, PsiReviewApprovalService, PsiReportService]
})
export class PsiModule {}
