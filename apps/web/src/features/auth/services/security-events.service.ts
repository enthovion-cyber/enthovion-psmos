import { api } from '@/services/api';
import type { AuthSecurityEvent } from '../types/security-event.types';

function unwrap<T>(response: { data: { data: T } }) {
  return response.data.data;
}

export const securityEventsService = {
  async mine(): Promise<AuthSecurityEvent[]> {
    return unwrap(await api.get('/auth/me/security-events'));
  },
  async profile(): Promise<AuthSecurityEvent[]> {
    return unwrap(await api.get('/profile/security-events'));
  },
  async reportSuspiciousLogin(input: { email?: string; message?: string; eventId?: string }) {
    return unwrap(await api.post('/auth/report-suspicious-login', input));
  }
};
