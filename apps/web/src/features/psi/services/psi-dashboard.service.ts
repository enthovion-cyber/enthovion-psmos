import type { PsiDashboardResponse } from '../types/psi-dashboard.types';
import { get } from './psi-api';

export const psiDashboardService = {
  dashboard: (params: Record<string, unknown> = {}) => get<PsiDashboardResponse>('/process-safety-information/dashboard', params),
  summary: () => get<Record<string, number>>('/process-safety-information/dashboard/summary'),
  missingCritical: () => get<Array<Record<string, unknown>>>('/process-safety-information/dashboard/missing-critical'),
  reviewOverdue: () => get<Array<Record<string, unknown>>>('/process-safety-information/dashboard/review-overdue'),
  mocUpdatesRequired: () => get<Array<Record<string, unknown>>>('/process-safety-information/dashboard/moc-updates-required'),
  pssrBlockers: () => get<Array<Record<string, unknown>>>('/process-safety-information/dashboard/pssr-blockers')
};
