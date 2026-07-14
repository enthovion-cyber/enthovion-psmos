import { api } from '@/services/api';
import type { EffectivePermissionUiSummary } from '../types/permission-ui.types';

function unwrap<T>(response: { data: { data: T } }) {
  return response.data.data;
}

export const effectivePermissionUiService = {
  async mine(): Promise<EffectivePermissionUiSummary> {
    return unwrap(await api.get('/auth/me/permissions'));
  },
  async forAdminUser(userId: string, includeDenied = false): Promise<EffectivePermissionUiSummary> {
    return unwrap(await api.get(`/admin/users/${userId}/effective-permissions`, { params: { includeDenied } }));
  }
};

