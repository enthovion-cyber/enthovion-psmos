import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { SupabaseModule } from '../database/supabase.module';
import { PermissionsModule } from '../permissions/permissions.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { SearchModule } from '../search/search.module';
import { TenantsModule } from '../tenants/tenants.module';
import { ActionsController } from './actions.controller';
import { ActionsService } from './actions.service';

@Module({
  imports: [SupabaseModule, AuditModule, PermissionsModule, SearchModule, TenantsModule, NotificationsModule, BullModule.registerQueue({ name: 'actions' })],
  controllers: [ActionsController],
  providers: [ActionsService],
  exports: [ActionsService]
})
export class ActionsModule {}
