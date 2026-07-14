import { api } from './api';

export type NotificationRecord = {
  id: string;
  tenant_id: string;
  site_id?: string | null;
  user_id: string;
  title: string;
  message: string;
  type: string;
  module: string;
  related_record_id?: string | null;
  related_record_type?: string | null;
  related_url?: string | null;
  priority: 'Info' | 'Normal' | 'High' | 'Safety-Critical' | string;
  status: 'Unread' | 'Read' | 'Archived' | string;
  read_at?: string | null;
  created_at: string;
};

export type NotificationPreference = {
  id: string;
  module: string;
  event_type: string;
  in_app_enabled: boolean;
  email_enabled: boolean;
  sms_enabled: boolean;
  digest_enabled: boolean;
};

export type NotificationPreferenceInput = {
  module: string;
  eventType: string;
  inAppEnabled: boolean;
  emailEnabled: boolean;
  smsEnabled: boolean;
  digestEnabled: boolean;
};

function data<T>(response: { data: T }) {
  return response.data;
}

export const notificationsService = {
  list: (params?: Record<string, string>) => api.get<NotificationRecord[]>('/notifications', { params }).then(data),
  unreadCount: () => api.get<{ count: number }>('/notifications/unread-count').then(data),
  get: (id: string) => api.get<NotificationRecord>(`/notifications/${id}`).then(data),
  markRead: (id: string) => api.patch<NotificationRecord>(`/notifications/${id}/read`).then(data),
  markAllRead: () => api.patch<NotificationRecord[]>('/notifications/read-all').then(data),
  archive: (id: string) => api.patch<NotificationRecord>(`/notifications/${id}/archive`).then(data),
  delete: (id: string) => api.delete<{ deleted: boolean }>(`/notifications/${id}`).then(data),
  preferences: () => api.get<NotificationPreference[]>('/notification-preferences').then(data),
  updatePreferences: (preferences: NotificationPreferenceInput[]) => api.patch<NotificationPreference[]>('/notification-preferences', { preferences }).then(data),
  testEmail: () => api.post<NotificationRecord>('/notifications/test-email').then(data),
  testSms: () => api.post<NotificationRecord>('/notifications/test-sms').then(data),
  dailyPreview: () => api.get<Record<string, unknown>>('/notifications/digest/daily-preview').then(data),
  weeklyPreview: () => api.get<Record<string, unknown>>('/notifications/digest/weekly-preview').then(data)
};
