import { get, patch } from '@/features/audit/services/audit-api';

export const regulatorySettingsService = {
  get: () => get<Record<string, unknown>>('/regulatory/settings'),
  update: (data: Record<string, unknown>) => patch<Record<string, unknown>>('/regulatory/settings', data)
};
