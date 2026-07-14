import { api } from '@/services/api';

function unwrap<T>(response: { data: { data: T } }) {
  return response.data.data;
}

export const passwordService = {
  async forgot(email: string): Promise<{ success: boolean; message: string }> {
    return unwrap(await api.post('/auth/forgot-password', { email }));
  },
  async reset(token: string, password: string) {
    return unwrap(await api.post('/auth/reset-password', { token, password }));
  },
  async forceChange(input: { currentPassword?: string; newPassword: string }) {
    return unwrap(await api.post('/auth/force-change-password', input));
  },
  async change(input: { currentPassword?: string; newPassword: string }) {
    return unwrap(await api.post('/profile/change-password', input));
  }
};
