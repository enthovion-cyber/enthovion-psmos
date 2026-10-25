// apps/api/src/contractor-safety/contractor-safety.module.ts
import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { SupabaseModule } from '../database/supabase.module';
import { PermissionsModule } from '../permissions/permissions.module';
import { TenantsModule } from '../tenants/tenants.module';
import { ContractorEvaluationService } from './contractor-evaluation.service';
import { ContractorInductionService } from './contractor-induction.service';
import { ContractorPortalController } from './contractor-portal.controller';
import { ContractorPortalService } from './contractor-portal.service';
import { ContractorPrequalService } from './contractor-prequal.service';
import { ContractorWorkerService } from './contractor-worker.service';
import { ContractorSafetyController } from './contractor-safety.controller';
import { ContractorSafetyService } from './contractor-safety.service';

@Module({
  imports: [SupabaseModule, AuditModule, PermissionsModule, TenantsModule],
  controllers: [ContractorSafetyController, ContractorPortalController],
  providers: [
    ContractorSafetyService,
    ContractorPortalService,
    ContractorPrequalService,
    ContractorWorkerService,
    ContractorInductionService,
    ContractorEvaluationService
  ],
  exports: [
    ContractorSafetyService,
    ContractorPortalService,
    ContractorPrequalService,
    ContractorWorkerService,
    ContractorInductionService,
    ContractorEvaluationService
  ]
})
export class ContractorSafetyModule {}
