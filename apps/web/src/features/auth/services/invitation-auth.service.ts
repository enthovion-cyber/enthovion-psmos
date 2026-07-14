import { api } from '@/services/api';
import type { InvitationSummary } from '../types/invitation-auth.types';

function unwrap<T>(response: { data: { data: T } }) {
  return response.data.data;
}

export const invitationAuthService = {
  async summary(token: string): Promise<InvitationSummary> {
    return unwrap(await api.get(`/auth/invitations/${encodeURIComponent(token)}`));
  },
  async accept(token: string, input: { displayName: string; password: string }) {
    return unwrap(await api.post(`/auth/invitations/${encodeURIComponent(token)}/accept`, input));
  },
  async acceptLegacy(input: { token: string; displayName: string; password: string }) {
    return unwrap(await api.post('/auth/accept-invite', input));
  }
};
