import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { SupabaseModule } from '../database/supabase.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { PermissionsModule } from '../permissions/permissions.module';
import { SearchModule } from '../search/search.module';
import { TenantsModule } from '../tenants/tenants.module';
import { EquipmentController } from './equipment.controller';
import { EquipmentService } from './equipment.service';
import { EquipmentPolicy } from './policies/equipment.policy';
import { EquipmentRepository } from './repositories/equipment.repository';
import { EquipmentTagValidator } from './validators/equipment-tag.validator';

@Module({
  imports: [SupabaseModule, AuditModule, NotificationsModule, PermissionsModule, SearchModule, TenantsModule],
  controllers: [EquipmentController],
  providers: [EquipmentService, EquipmentRepository, EquipmentTagValidator, EquipmentPolicy],
  exports: [EquipmentService]
})
export class EquipmentModule {}
