import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../../database/supabase.service';

@Injectable()
export class NotificationRepository {
  constructor(public readonly db: SupabaseService) {}

  notifications() {
    return this.db.from('notifications');
  }

  preferences() {
    return this.db.from('notification_preferences');
  }

  deliveries() {
    return this.db.from('notification_deliveries');
  }

  emailLogs() {
    return this.db.from('email_logs');
  }

  smsLogs() {
    return this.db.from('sms_logs');
  }

  templates() {
    return this.db.from('notification_templates');
  }

  subscriptions() {
    return this.db.from('notification_subscriptions');
  }

  users() {
    return this.db.from('User');
  }

  roles() {
    return this.db.from('Role');
  }

  userRoles() {
    return this.db.from('UserRole');
  }
}
