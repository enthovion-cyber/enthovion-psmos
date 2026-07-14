import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AuditService } from '../audit/audit.service';
import { JsonValue } from '../common/types/db.types';
import { EmailNotificationChannel } from './channels/email.channel';
import { InAppNotificationChannel } from './channels/in-app.channel';
import { SmsNotificationChannel } from './channels/sms.channel';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { NotificationFilterDto } from './dto/notification-filter.dto';
import { NotificationPreferenceDto, UpdatePreferencesDto } from './dto/update-preferences.dto';
import { NotificationRepository } from './repositories/notification.repository';

type NotifyInput = {
  userId: string;
  tenantId: string;
  companyId?: string | null | undefined;
  siteId?: string | null | undefined;
  type: string;
  module: string;
  title: string;
  message: string;
  relatedRecordId?: string | null | undefined;
  relatedRecordType?: string | null | undefined;
  relatedUrl?: string | null | undefined;
  priority?: string | undefined;
  channels?: string[] | undefined;
  metadata?: Record<string, unknown> | undefined;
};

type Scope = { allowedSiteIds?: string[]; selectedSiteId?: string | null; corporateView?: boolean };

const defaultEvents: Array<[string, string]> = [
  ['iam', 'iam.user.invited'],
  ['iam', 'iam.role.assigned'],
  ['iam', 'iam.role.removed'],
  ['iam', 'iam.password.reset'],
  ['iam', 'iam.user.suspended'],
  ['equipment', 'equipment.created'],
  ['equipment', 'equipment.updated'],
  ['equipment', 'equipment.qr.generated'],
  ['equipment', 'equipment.document.linked'],
  ['equipment', 'equipment.inspection.due'],
  ['equipment', 'equipment.safety_critical.changed'],
  ['actions', 'action.assigned'],
  ['actions', 'action.updated'],
  ['actions', 'action.overdue'],
  ['actions', 'action.evidence.uploaded'],
  ['actions', 'action.verification.submitted'],
  ['actions', 'action.verification.approved'],
  ['actions', 'action.verification.rejected'],
  ['actions', 'action.closed'],
  ['actions', 'action.reopened'],
  ['documents', 'document.uploaded'],
  ['documents', 'document.review.due'],
  ['documents', 'document.approved'],
  ['documents', 'document.rejected'],
  ['system', 'system.daily_digest'],
  ['system', 'system.weekly_summary'],
  ['system', 'system.escalation_alert'],
  ['ptw', 'ptw.expiring'],
  ['ptw', 'ptw.conflict.detected'],
  ['moc', 'moc.approval.request'],
  ['hazop', 'hazop.recommendation.overdue'],
  ['pssr', 'pssr.signoff.required']
];

@Injectable()
export class NotificationsService {
  constructor(
    private readonly repo: NotificationRepository,
    private readonly audit: AuditService,
    private readonly events: EventEmitter2,
    private readonly inApp: InAppNotificationChannel,
    private readonly email: EmailNotificationChannel,
    private readonly sms: SmsNotificationChannel
  ) {}

  async inbox(userId: string, tenantId: string, scope: Scope = {}, filters: NotificationFilterDto = {}) {
    let query = this.repo.notifications().select('*').eq('user_id', userId).eq('tenant_id', tenantId);
    if (filters.status) query = query.eq('status', filters.status);
    if (filters.module) query = query.eq('module', filters.module);
    if (filters.priority) query = query.eq('priority', filters.priority);
    if (scope.selectedSiteId) query = query.eq('site_id', scope.selectedSiteId);
    else if (!scope.corporateView && scope.allowedSiteIds?.length) query = query.or(`site_id.is.null,site_id.in.(${scope.allowedSiteIds.join(',')})`);
    return this.repo.db.many<any>(query.order('created_at', { ascending: false }).limit(100));
  }

  async unreadCount(userId: string, tenantId: string, scope: Scope = {}) {
    const rows = await this.inbox(userId, tenantId, scope, { status: 'Unread' });
    return { count: rows.length };
  }

  async get(userId: string, tenantId: string, id: string, scope: Scope = {}) {
    const notification = await this.repo.db.single<any>(this.repo.notifications().select('*').eq('tenant_id', tenantId).eq('id', id).maybeSingle());
    if (!notification) throw new NotFoundException('Notification not found');
    if (notification.user_id !== userId) throw new ForbiddenException('You can only view your own notifications');
    this.assertSiteAccess(notification.site_id, scope);
    return notification;
  }

  async notifyUser(input: NotifyInput) {
    const user = await this.repo.db.single<any>(this.repo.users().select('id,email,status,tenantId,profile:UserProfile(phone,mobile)').eq('id', input.userId).maybeSingle());
    if (!user || user.tenantId !== input.tenantId || user.status !== 'ACTIVE') throw new BadRequestException('Notification recipient is unavailable');
    const preference = await this.preferenceFor(input.tenantId, input.userId, input.module, input.type);
    const requestedChannels = input.channels?.length ? input.channels : ['in_app', 'email'];
    const priority = input.priority ?? 'Normal';
    const channels = new Set(requestedChannels);
    channels.add('in_app');
    if (priority === 'Safety-Critical') channels.add('sms');

    const notification = await this.repo.db.single<any>(this.repo.notifications().insert({
      id: crypto.randomUUID(),
      tenant_id: input.tenantId,
      company_id: input.companyId ?? null,
      site_id: input.siteId ?? null,
      user_id: input.userId,
      title: input.title,
      message: input.message,
      type: input.type,
      module: input.module,
      related_record_id: input.relatedRecordId ?? null,
      related_record_type: input.relatedRecordType ?? null,
      related_url: input.relatedUrl ?? null,
      priority,
      status: 'Unread',
      metadata: input.metadata ?? {}
    }).select().single());

    await this.inApp.createDelivery(input.tenantId, notification.id);
    if (channels.has('email') && preference.email_enabled) {
      await this.email.send({ tenantId: input.tenantId, notificationId: notification.id, userId: input.userId, to: user.email, subject: input.title, body: input.message });
    }
    const phone = user.profile?.mobile ?? user.profile?.phone;
    if (channels.has('sms') && preference.sms_enabled && phone) {
      await this.sms.send({ tenantId: input.tenantId, notificationId: notification.id, userId: input.userId, to: phone, body: input.message.slice(0, 320) });
    }
    this.events.emit('notification.created', { tenantId: input.tenantId, userId: input.userId, notification });
    return notification;
  }

  async notifyRole(tenantId: string, roleName: string, siteId: string | null, event: Omit<NotifyInput, 'tenantId' | 'userId'>) {
    const role = await this.repo.db.single<any>(this.repo.roles().select('id').eq('tenantId', tenantId).or(`key.eq.${roleName},name.eq.${roleName}`).maybeSingle());
    if (!role) return [];
    let roleQuery = this.repo.userRoles().select('userId').eq('roleId', role.id);
    if (siteId) roleQuery = roleQuery.or(`siteId.is.null,siteId.eq.${siteId}`);
    const rows = await this.repo.db.many<any>(roleQuery);
    return Promise.all(rows.map((row) => this.notifyUser({ ...event, tenantId, userId: row.userId, siteId: event.siteId ?? siteId })));
  }

  async notifyDepartment(tenantId: string, departmentId: string, event: Omit<NotifyInput, 'tenantId' | 'userId'>) {
    const users = await this.repo.db.many<any>(this.repo.users().select('id').eq('tenantId', tenantId).eq('department', departmentId).eq('status', 'ACTIVE'));
    return Promise.all(users.map((user) => this.notifyUser({ ...event, tenantId, userId: user.id })));
  }

  async notifyWatchers(tenantId: string, sourceModule: string, sourceRecordId: string, event: Omit<NotifyInput, 'tenantId' | 'userId'>) {
    const watchers = await this.repo.db.many<any>(this.repo.subscriptions().select('user_id').eq('tenant_id', tenantId).eq('source_module', sourceModule).eq('source_record_id', sourceRecordId));
    return Promise.all(watchers.map((watcher) => this.notifyUser({ ...event, tenantId, userId: watcher.user_id })));
  }

  async createFromApi(tenantId: string, actorId: string, dto: CreateNotificationDto, scope: Scope) {
    this.assertSiteAccess(dto.siteId, scope);
    const notification = await this.notifyUser({
      tenantId,
      userId: dto.userId,
      companyId: dto.companyId,
      siteId: dto.siteId,
      type: dto.type,
      module: dto.module,
      title: dto.title,
      message: dto.message,
      relatedRecordId: dto.relatedRecordId,
      relatedRecordType: dto.relatedRecordType,
      relatedUrl: dto.relatedUrl,
      priority: dto.priority,
      channels: dto.channels,
      metadata: dto.metadata
    });
    await this.audit.write({ tenantId, actorId, action: 'NOTIFICATION_SENT', entityType: 'Notification', entityId: notification.id, after: notification as JsonValue });
    return notification;
  }

  async markRead(userId: string, tenantId: string, id: string, scope: Scope) {
    await this.get(userId, tenantId, id, scope);
    return this.repo.db.single(this.repo.notifications().update({ status: 'Read', read_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('id', id).eq('user_id', userId).select().single());
  }

  async markAllRead(userId: string, tenantId: string, scope: Scope) {
    let query = this.repo.notifications().update({ status: 'Read', read_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('user_id', userId).eq('status', 'Unread');
    if (scope.selectedSiteId) query = query.eq('site_id', scope.selectedSiteId);
    return this.repo.db.many(query.select());
  }

  async archive(userId: string, tenantId: string, id: string, scope: Scope) {
    await this.get(userId, tenantId, id, scope);
    return this.repo.db.single(this.repo.notifications().update({ status: 'Archived', archived_at: new Date().toISOString() }).eq('tenant_id', tenantId).eq('id', id).eq('user_id', userId).select().single());
  }

  async delete(userId: string, tenantId: string, id: string, scope: Scope) {
    await this.get(userId, tenantId, id, scope);
    await this.repo.db.single(this.repo.notifications().delete().eq('tenant_id', tenantId).eq('id', id).eq('user_id', userId).select().single());
    return { deleted: true };
  }

  async preferences(userId: string, tenantId: string) {
    const existing = await this.repo.db.many<any>(this.repo.preferences().select('*').eq('tenant_id', tenantId).eq('user_id', userId).order('module'));
    if (existing.length) return existing;
    const rows = defaultEvents.map(([module, eventType]) => ({
      id: crypto.randomUUID(),
      tenant_id: tenantId,
      user_id: userId,
      module,
      event_type: eventType,
      in_app_enabled: true,
      email_enabled: true,
      sms_enabled: eventType.includes('safety') || eventType.includes('overdue'),
      digest_enabled: true,
      updated_at: new Date().toISOString()
    }));
    return this.repo.db.many<any>(this.repo.preferences().insert(rows).select());
  }

  async updatePreferences(userId: string, tenantId: string, actorId: string, dto: UpdatePreferencesDto) {
    const before = await this.preferences(userId, tenantId);
    const rows = dto.preferences.map((pref: NotificationPreferenceDto) => ({
      id: crypto.randomUUID(),
      tenant_id: tenantId,
      user_id: userId,
      module: pref.module,
      event_type: pref.eventType,
      in_app_enabled: pref.inAppEnabled,
      email_enabled: pref.emailEnabled,
      sms_enabled: pref.smsEnabled,
      digest_enabled: pref.digestEnabled,
      updated_at: new Date().toISOString()
    }));
    await this.repo.db.many(this.repo.preferences().upsert(rows, { onConflict: 'user_id,module,event_type' }).select());
    const after = await this.preferences(userId, tenantId);
    await this.audit.write({ tenantId, actorId, action: 'NOTIFICATION_PREFERENCES_UPDATED', entityType: 'NotificationPreference', entityId: userId, before: before as JsonValue, after: after as JsonValue });
    return after;
  }

  async testEmail(userId: string, tenantId: string, actorId: string) {
    const notification = await this.notifyUser({ tenantId, userId, type: 'system.test_email', module: 'system', title: 'Test email notification', message: 'This is a PSM OS test email notification.', priority: 'Info', channels: ['email'] });
    await this.audit.write({ tenantId, actorId, action: 'NOTIFICATION_EMAIL_TEST', entityType: 'Notification', entityId: notification.id });
    return notification;
  }

  async testSms(userId: string, tenantId: string, actorId: string) {
    const notification = await this.notifyUser({ tenantId, userId, type: 'system.test_sms', module: 'system', title: 'Test SMS notification', message: 'This is a PSM OS test SMS notification.', priority: 'Safety-Critical', channels: ['sms'] });
    await this.audit.write({ tenantId, actorId, action: 'NOTIFICATION_SMS_TEST', entityType: 'Notification', entityId: notification.id });
    return notification;
  }

  async dailyDigestPreview(userId: string, tenantId: string) {
    const notifications = await this.inbox(userId, tenantId, {}, {});
    return { title: 'Daily Digest Preview', generatedAt: new Date().toISOString(), openAlerts: notifications.filter((item) => item.status === 'Unread').slice(0, 10), safetyCritical: notifications.filter((item) => item.priority === 'Safety-Critical') };
  }

  async weeklyDigestPreview(userId: string, tenantId: string) {
    const notifications = await this.inbox(userId, tenantId, {}, {});
    return { title: 'Weekly Summary Preview', generatedAt: new Date().toISOString(), total: notifications.length, highPriority: notifications.filter((item) => ['High', 'Safety-Critical'].includes(item.priority)).length, modules: this.groupBy(notifications, 'module') };
  }

  private async preferenceFor(tenantId: string, userId: string, module: string, eventType: string) {
    const pref = await this.repo.db.single<any>(this.repo.preferences().select('*').eq('tenant_id', tenantId).eq('user_id', userId).eq('module', module).eq('event_type', eventType).maybeSingle());
    return pref ?? { in_app_enabled: true, email_enabled: true, sms_enabled: eventType.includes('safety') || eventType.includes('overdue'), digest_enabled: true };
  }

  private assertSiteAccess(siteId: string | null | undefined, scope: Scope) {
    if (!siteId || scope.corporateView) return;
    if (scope.allowedSiteIds?.length && !scope.allowedSiteIds.includes(siteId)) throw new ForbiddenException('Notification is outside your site access scope');
  }

  private groupBy(rows: any[], key: string) {
    return rows.reduce<Record<string, number>>((acc, row) => {
      const value = row[key] ?? 'unknown';
      acc[value] = (acc[value] ?? 0) + 1;
      return acc;
    }, {});
  }
}
