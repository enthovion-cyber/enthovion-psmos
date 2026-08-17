import type { AuditDashboard } from '../types/audit.types';
import { get } from './audit-api';

export const auditDashboardService = {
  dashboard: (params?: Record<string, unknown>) => get<AuditDashboard>('/audit-compliance/dashboard', params),
  summary: (params?: Record<string, unknown>) => get<Record<string, number>>('/audit-compliance/dashboard/summary', params)
};
