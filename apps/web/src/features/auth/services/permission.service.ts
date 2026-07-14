import { api } from '@/services/api';
import type { PermissionCheck } from '../types/permission.types';

function unwrap<T>(response: { data: { data: T } }) {
  return response.data.data;
}

export const permissionService = {
  async myPermissions() {
    const response = unwrap<{ permissions?: string[] } | string[]>(await api.get('/auth/me/permissions'));
    return Array.isArray(response) ? response : response.permissions ?? [];
  },
  async check(permission: string): Promise<PermissionCheck> {
    return unwrap(await api.post('/auth/check-permission', { permission }));
  }
};
