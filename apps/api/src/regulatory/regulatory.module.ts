import { Module } from '@nestjs/common';
import { ActionsModule } from '../actions/actions.module';
import { AuditModule } from '../audit/audit.module';
import { SupabaseModule } from '../database/supabase.module';
import { PermissionsModule } from '../permissions/permissions.module';
import { TenantsModule } from '../tenants/tenants.module';
import { StorageModule } from '../storage/storage.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { RegulatoryController } from './regulatory.controller';
import { RegulatoryHistoryTrendService } from './regulatory-history-trend.service';
import { RegulatoryService } from './regulatory.service';

@Module({
  imports: [SupabaseModule, AuditModule, PermissionsModule, TenantsModule, ActionsModule, StorageModule, NotificationsModule],
  controllers: [RegulatoryController],
  providers: [RegulatoryService, RegulatoryHistoryTrendService],
  exports: [RegulatoryService, RegulatoryHistoryTrendService]
})
export class RegulatoryModule {}
