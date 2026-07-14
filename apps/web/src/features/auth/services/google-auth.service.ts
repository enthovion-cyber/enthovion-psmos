import { api } from '@/services/api';
import type { GoogleAuthResult } from '../types/google-auth.types';

function unwrap<T>(response: { data: { data: T } }) {
  return response.data.data;
}

export const googleAuthService = {
  async start(): Promise<GoogleAuthResult> {
    return unwrap(await api.get('/auth/google/start'));
  },
  async linkAccount(input: { email: string; providerUserId?: string }) {
    return unwrap(await api.post('/auth/google/link-account', input));
  },
  async unlinkAccount() {
    return unwrap(await api.post('/auth/google/unlink-account'));
  }
};
