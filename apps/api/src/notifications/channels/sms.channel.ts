import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NotificationRepository } from '../repositories/notification.repository';

@Injectable()
export class SmsNotificationChannel {
  constructor(
    private readonly repo: NotificationRepository,
    private readonly config: ConfigService
  ) {}

  async send(input: { tenantId: string; notificationId: string; userId: string; to: string; body: string }) {
    const accountSid = this.config.get<string>('TWILIO_ACCOUNT_SID') ?? process.env.TWILIO_ACCOUNT_SID;
    const token = this.config.get<string>('TWILIO_AUTH_TOKEN') ?? process.env.TWILIO_AUTH_TOKEN;
    const configured = Boolean(accountSid && token);
    const log = await this.repo.db.single<any>(this.repo.smsLogs().insert({
      id: crypto.randomUUID(),
      tenant_id: input.tenantId,
      notification_id: input.notificationId,
      user_id: input.userId,
      to_phone: input.to,
      body: input.body,
      status: configured ? 'queued' : 'skipped',
      error_message: configured ? null : 'Twilio credentials are not configured'
    }).select().single());
    await this.repo.db.single(this.repo.deliveries().insert({
      id: crypto.randomUUID(),
      tenant_id: input.tenantId,
      notification_id: input.notificationId,
      channel: 'sms',
      status: configured ? 'queued' : 'failed',
      attempts: 1,
      failed_at: configured ? null : new Date().toISOString(),
      error_message: configured ? null : 'Twilio credentials are not configured',
      updated_at: new Date().toISOString()
    }).select().single());
    return log;
  }
}
