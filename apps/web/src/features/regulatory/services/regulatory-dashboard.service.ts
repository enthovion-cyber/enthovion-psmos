import { get } from '@/features/audit/services/audit-api';
import type { RegulatoryDashboard } from '../types/regulatory.types';

export const regulatoryDashboardService = {
  dashboard: (params?: Record<string, unknown>) => get<RegulatoryDashboard>('/regulatory/dashboard', params),
  summary: (params?: Record<string, unknown>) => get<Record<string, number>>('/regulatory/dashboard/summary', params),
  group: (path: string, params?: Record<string, unknown>) => get<{ rows: Array<{ label: string; count: number }> }>(`/regulatory/dashboard/${path}`, params)
};
