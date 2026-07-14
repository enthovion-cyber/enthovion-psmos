import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { SupabaseModule } from '../database/supabase.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { PermissionsModule } from '../permissions/permissions.module';
import { SignaturesController } from './signatures.controller';
import { SignaturesService } from './signatures.service';

@Module({
  imports: [SupabaseModule, AuditModule, PermissionsModule, NotificationsModule],
  controllers: [SignaturesController],
  providers: [SignaturesService],
  exports: [SignaturesService]
})
export class SignaturesModule {}
