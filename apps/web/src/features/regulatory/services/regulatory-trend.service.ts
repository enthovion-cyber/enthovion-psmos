import { get, patch, post } from '@/features/audit/services/audit-api';
import type { Paged, RegulatoryHistoryEvent, RegulatoryManagementReviewCandidate, RegulatoryRepeatGap, RegulatoryTrendRun } from '../types/regulatory-history-trend.types';

export const regulatoryTrendService = {
  normalizeHistory: () => post<{ normalized: number }>('/regulatory/history/normalize'),
  historyDashboard: (params?: Record<string, unknown>) => get<Record<string, unknown>>('/regulatory/history/dashboard', params),
  timeline: (params?: Record<string, unknown>) => get<Paged<RegulatoryHistoryEvent>>('/regulatory/history/timeline', params),
  snapshots: (params?: Record<string, unknown>) => get<Paged<Record<string, unknown>>>('/regulatory/history/snapshots', params),
  createSnapshot: (payload: Record<string, unknown>) => post<Record<string, unknown>>('/regulatory/history/snapshots', payload),
  trendDashboard: (params?: Record<string, unknown>) => get<Record<string, unknown>>('/regulatory/trends/dashboard', params),
  runs: (params?: Record<string, unknown>) => get<Paged<RegulatoryTrendRun>>('/regulatory/trends/runs', params),
  createRun: (payload: Record<string, unknown>) => post<Record<string, unknown>>('/regulatory/trends/runs', payload),
  run: (id: string) => get<Record<string, unknown>>(`/regulatory/trends/runs/${id}`),
  recalculate: (id: string) => post<Record<string, unknown>>(`/regulatory/trends/runs/${id}/recalculate`),
  repeatGaps: (params?: Record<string, unknown>) => get<Paged<RegulatoryRepeatGap>>('/regulatory/trends/repeat-gaps', params),
  detectRepeatGaps: () => post<Record<string, unknown>>('/regulatory/trends/repeat-gaps/detect'),
  reviewRepeatGap: (id: string, decision: 'confirm' | 'reject' | 'archive', reason: string) => post<Record<string, unknown>>(`/regulatory/trends/repeat-gaps/${id}/${decision}`, { reason }),
  recurringIssues: (params?: Record<string, unknown>) => get<Paged<Record<string, unknown>>>('/regulatory/trends/recurring-issues', params),
  detectRecurringIssues: () => post<Record<string, unknown>>('/regulatory/trends/recurring-issues/detect'),
  managementDashboard: (params?: Record<string, unknown>) => get<Record<string, unknown>>('/regulatory/management-review-readiness/dashboard', params),
  managementCandidates: (params?: Record<string, unknown>) => get<Paged<RegulatoryManagementReviewCandidate>>('/regulatory/management-review-readiness/register', params),
  createCandidate: (payload: Record<string, unknown>) => post<Record<string, unknown>>('/regulatory/management-review-readiness/candidates', payload),
  updateCandidate: (id: string, payload: Record<string, unknown>) => patch<Record<string, unknown>>(`/regulatory/management-review-readiness/candidates/${id}`, payload),
  kpiFeed: (params?: Record<string, unknown>) => get<Record<string, unknown>>('/regulatory/management-review-readiness/kpi-feed', params),
  generateKpiSnapshot: (payload: Record<string, unknown>) => post<Record<string, unknown>>('/regulatory/management-review-readiness/kpi-feed/generate-snapshot', payload)
};
