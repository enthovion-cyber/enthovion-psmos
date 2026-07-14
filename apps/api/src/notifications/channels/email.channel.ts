import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NotificationRepository } from '../repositories/notification.repository';

@Injectable()
export class EmailNotificationChannel {
  constructor(
    private readonly repo: NotificationRepository,
    private readonly config: ConfigService
  ) {}

  async send(input: { tenantId: string; notificationId: string; userId: string; to: string; subject: string; body: string }) {
    const apiKey = this.config.get<string>('RESEND_API_KEY') ?? process.env.RESEND_API_KEY;
    const log = await this.repo.db.single<any>(this.repo.emailLogs().insert({
      id: crypto.randomUUID(),
      tenant_id: input.tenantId,
      notification_id: input.notificationId,
      user_id: input.userId,
      to_email: input.to,
      subject: input.subject,
      body: input.body,
      status: apiKey ? 'queued' : 'skipped',
      error_message: apiKey ? null : 'RESEND_API_KEY is not configured'
    }).select().single());
    await this.repo.db.single(this.repo.deliveries().insert({
      id: crypto.randomUUID(),
      tenant_id: input.tenantId,
      notification_id: input.notificationId,
      channel: 'email',
      status: apiKey ? 'queued' : 'failed',
      attempts: 1,
      failed_at: apiKey ? null : new Date().toISOString(),
      error_message: apiKey ? null : 'RESEND_API_KEY is not configured',
      updated_at: new Date().toISOString()
    }).select().single());
    return log;
  }
}
