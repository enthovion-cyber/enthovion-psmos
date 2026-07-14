import { Injectable } from '@nestjs/common';
import { NotificationRepository } from '../repositories/notification.repository';

@Injectable()
export class InAppNotificationChannel {
  constructor(private readonly repo: NotificationRepository) {}

  async createDelivery(tenantId: string, notificationId: string) {
    return this.repo.db.single(this.repo.deliveries().insert({
      id: crypto.randomUUID(),
      tenant_id: tenantId,
      notification_id: notificationId,
      channel: 'in_app',
      status: 'sent',
      sent_at: new Date().toISOString(),
      attempts: 1,
      updated_at: new Date().toISOString()
    }).select().single());
  }
}
