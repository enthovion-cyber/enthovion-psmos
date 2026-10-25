import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { SupabaseModule } from '../database/supabase.module';
import { PermissionsModule } from '../permissions/permissions.module';
import { TenantsModule } from '../tenants/tenants.module';
import { OpAcknowledgmentService } from './op-acknowledgment.service';
import { OpAuthoringService } from './op-authoring.service';
import { OpCertificationService } from './op-certification.service';
import { OpExecutionService } from './op-execution.service';
import { OpIntegrationsService } from './op-integrations.service';
import { OpLifecycleService } from './op-lifecycle.service';
import { OpReportsService } from './op-reports.service';
import { OpSwpService } from './op-swp.service';
import { OperatingProceduresController } from './operating-procedures.controller';
import { OperatingProceduresService } from './operating-procedures.service';

@Module({
  imports: [SupabaseModule, AuditModule, PermissionsModule, TenantsModule],
  controllers: [OperatingProceduresController],
  providers: [
    OperatingProceduresService,
    OpAuthoringService,
    OpLifecycleService,
    OpCertificationService,
    OpExecutionService,
    OpIntegrationsService,
    OpAcknowledgmentService,
    OpSwpService,
    OpReportsService
  ],
  exports: [
    OperatingProceduresService,
    OpAuthoringService,
    OpLifecycleService,
    OpCertificationService,
    OpExecutionService,
    OpIntegrationsService,
    OpAcknowledgmentService,
    OpSwpService,
    OpReportsService
  ]
})
export class OperatingProceduresModule {}
