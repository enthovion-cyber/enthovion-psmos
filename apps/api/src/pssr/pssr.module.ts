import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { SupabaseModule } from '../database/supabase.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { PermissionsModule } from '../permissions/permissions.module';
import { SearchModule } from '../search/search.module';
import { TenantsModule } from '../tenants/tenants.module';
import { PssrChecklistGeneratorService } from './pssr-checklist-generator.service';
import { PssrController, PublicPssrShareController } from './pssr.controller';
import { PssrNumberingService } from './pssr-numbering.service';
import { PssrService } from './pssr.service';
import { PssrStartupBlockerService } from './pssr-startup-blocker.service';

@Module({
  imports: [SupabaseModule, AuditModule, NotificationsModule, PermissionsModule, SearchModule, TenantsModule],
  controllers: [PssrController, PublicPssrShareController],
  providers: [PssrService, PssrNumberingService, PssrChecklistGeneratorService, PssrStartupBlockerService],
  exports: [PssrService]
})
export class PssrModule {}
