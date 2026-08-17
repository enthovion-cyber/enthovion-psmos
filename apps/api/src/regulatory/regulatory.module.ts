import { Module } from '@nestjs/common';
import { ActionsModule } from '../actions/actions.module';
import { AuditModule } from '../audit/audit.module';
import { SupabaseModule } from '../database/supabase.module';
import { PermissionsModule } from '../permissions/permissions.module';
import { TenantsModule } from '../tenants/tenants.module';
import { RegulatoryController } from './regulatory.controller';
import { RegulatoryService } from './regulatory.service';

@Module({
  imports: [SupabaseModule, AuditModule, PermissionsModule, TenantsModule, ActionsModule],
  controllers: [RegulatoryController],
  providers: [RegulatoryService],
  exports: [RegulatoryService]
})
export class RegulatoryModule {}
