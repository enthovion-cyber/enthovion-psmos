import { Injectable } from '@nestjs/common';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class NotificationCenterIntegrationService {
  constructor(private readonly notifications: NotificationsService) {}

  notifyUser(input: Parameters<NotificationsService['notifyUser']>[0]) {
    return this.notifications.notifyUser(input);
  }
}
