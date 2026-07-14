import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { SupabaseModule } from '../database/supabase.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { PermissionsModule } from '../permissions/permissions.module';
import { SearchModule } from '../search/search.module';
import { TenantsModule } from '../tenants/tenants.module';
import { DocumentsController } from './documents.controller';
import { DocumentsRepository } from './repositories/documents.repository';
import { DocumentsService } from './documents.service';

@Module({
  imports: [SupabaseModule, AuditModule, NotificationsModule, PermissionsModule, SearchModule, TenantsModule],
  controllers: [DocumentsController],
  providers: [DocumentsService, DocumentsRepository],
  exports: [DocumentsService]
})
export class DocumentsModule {}
