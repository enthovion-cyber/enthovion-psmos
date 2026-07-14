import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { SupabaseModule } from '../database/supabase.module';
import { PermissionsModule } from '../permissions/permissions.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { SignaturesModule } from '../signatures/signatures.module';
import { TenantsModule } from '../tenants/tenants.module';
import { WorkflowsModule } from '../workflows/workflows.module';
import { StorageModule } from '../storage/storage.module';
import { ActionsModule } from '../actions/actions.module';
import { SearchModule } from '../search/search.module';
import { LopaController } from './lopa.controller';
import { LopaService } from './lopa.service';

@Module({
  imports: [SupabaseModule, AuditModule, PermissionsModule, TenantsModule, NotificationsModule, SignaturesModule, WorkflowsModule, StorageModule, ActionsModule, SearchModule],
  controllers: [LopaController],
  providers: [LopaService],
  exports: [LopaService]
})
export class LopaModule {}
