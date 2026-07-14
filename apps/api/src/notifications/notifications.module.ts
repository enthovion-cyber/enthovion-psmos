import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { SupabaseModule } from '../database/supabase.module';
import { PermissionsModule } from '../permissions/permissions.module';
import { TenantsModule } from '../tenants/tenants.module';
import { EmailNotificationChannel } from './channels/email.channel';
import { InAppNotificationChannel } from './channels/in-app.channel';
import { SmsNotificationChannel } from './channels/sms.channel';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { NotificationRepository } from './repositories/notification.repository';

@Module({
  imports: [SupabaseModule, AuditModule, PermissionsModule, TenantsModule, BullModule.registerQueue({ name: 'notifications' })],
  controllers: [NotificationsController],
  providers: [NotificationsService, NotificationRepository, InAppNotificationChannel, EmailNotificationChannel, SmsNotificationChannel],
  exports: [NotificationsService]
})
export class NotificationsModule {}
