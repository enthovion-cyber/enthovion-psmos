import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { SupabaseModule } from '../database/supabase.module';
import { PermissionsModule } from '../permissions/permissions.module';
import { TenantsModule } from '../tenants/tenants.module';
import { IncidentController } from './incident.controller';
import { IncidentService } from './incident.service';

@Module({
  imports: [SupabaseModule, AuditModule, PermissionsModule, TenantsModule],
  controllers: [IncidentController],
  providers: [IncidentService],
  exports: [IncidentService]
})
export class IncidentModule {}
