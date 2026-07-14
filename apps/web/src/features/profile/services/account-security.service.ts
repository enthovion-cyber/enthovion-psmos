import { api } from '@/services/api';
import type { DangerZoneRequest, ProfileNotificationPreferences, ProfileSecurityResponse, ProfileSessionsResponse } from '../types/account-security.types';

const unwrap = <T,>(response: { data: { data: T } }) => response.data.data;

export const accountSecurityService = {
  account: () => api.get('/profile/account').then(unwrap<any>),
  security: () => api.get('/profile/security').then(unwrap<ProfileSecurityResponse>),
  sessions: () => api.get('/profile/sessions').then(unwrap<ProfileSessionsResponse>),
  revokeSession: (sessionId: string) => api.post(`/profile/sessions/${sessionId}/revoke`).then(unwrap<any>),
  notifications: () => api.get('/profile/notifications').then(unwrap<ProfileNotificationPreferences>),
  saveNotifications: (input: ProfileNotificationPreferences) => api.patch('/profile/notifications', input).then(unwrap<ProfileNotificationPreferences>),
  dangerRequests: () => api.get('/profile/danger-zone/requests').then(unwrap<DangerZoneRequest[]>),
  requestDelete: (input: { reason?: string; confirmationText: string }) => api.post('/profile/delete-request', input).then(unwrap<DangerZoneRequest>),
  requestDeactivate: (input: { reason?: string; confirmationText: string }) => api.post('/profile/deactivate-request', input).then(unwrap<DangerZoneRequest>)
};
