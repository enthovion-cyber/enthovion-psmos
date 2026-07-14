import { api } from '@/services/api';
import type { AuthLoginInput, AuthLoginResult } from '../types/auth.types';

function unwrap<T>(response: { data: { data: T } }) {
  return response.data.data;
}

export const authFeatureService = {
  async login(input: AuthLoginInput): Promise<AuthLoginResult> {
    return unwrap(await api.post('/auth/login', input));
  },
  async logout() {
    return unwrap(await api.post('/auth/logout'));
  },
  async session() {
    return unwrap(await api.get('/auth/session'));
  },
  async validateSession(input: { sessionVersion?: number; permissionVersion?: number }) {
    return unwrap(await api.post('/auth/validate-session', input));
  },
  async refreshSession(): Promise<AuthLoginResult> {
    return unwrap(await api.post('/auth/refresh-session'));
  },
  async forceLogoutCurrent(reason?: string) {
    return unwrap(await api.post('/auth/force-logout-current', { reason }));
  }
};
