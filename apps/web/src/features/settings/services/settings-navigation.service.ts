import { api } from '@/services/api';
import type { SettingsNavigationResponse } from '../types/settings-navigation.types';

const unwrap = <T,>(response: { data: { data: T } }) => response.data.data;

export const settingsNavigationService = {
  navigation: () => api.get('/settings/navigation').then(unwrap<SettingsNavigationResponse>),
  general: () => api.get('/settings/general').then(unwrap<any>).catch(() => ({ preferences: {} })),
  saveGeneral: (input: Record<string, unknown>) => api.patch('/settings/general', input).then(unwrap<any>)
};
