import { api } from '@/services/api';
import type {
  ExecutiveTrendCollection,
  ExecutiveTrendDashboard,
  ExecutiveTrendRun,
  ExecutiveRepeatIssue,
  ExecutiveRepeatOccurrence,
  ExecutiveRecurringCluster,
  ExecutiveTrendInsight,
  ExecutiveTrendAlert,
  ExecutiveTrendAlertRule,
} from '../types/executive-trend.types';

function unwrap<T>(response: { data: T | { data?: T } }) {
  const body = response.data as { data?: T };
  return body && typeof body === 'object' && 'data' in body ? (body.data as T) : (response.data as T);
}

const get = <T>(path: string, params?: Record<string, unknown>) =>
  api.get(path, { params }).then(unwrap<T>);

const post = <T>(path: string, body?: Record<string, unknown>) =>
  api.post(path, body ?? {}).then(unwrap<T>);

const patch = <T>(path: string, body?: Record<string, unknown>) =>
  api.patch(path, body ?? {}).then(unwrap<T>);

export const executiveTrendApi = {
  // Dashboard & Explorer
  dashboard: (params?: Record<string, unknown>) =>
    get<ExecutiveTrendDashboard>('/executive/trends/dashboard', params),
  explorer: (params?: Record<string, unknown>) =>
    get<{ runs: ExecutiveTrendRun[]; points: Array<Record<string, unknown>>; dataQuality: string }>(
      '/executive/trends/explorer',
      params
    ),
  section: (section: string, params?: Record<string, unknown>) =>
    get<ExecutiveTrendCollection>(`/executive/trends/${section}`, params),

  // Runs
  runs: (params?: Record<string, unknown>) =>
    get<{ rows: ExecutiveTrendRun[]; total: number }>('/executive/trends/runs', params),
  run: (id: string) =>
    get<{
      run: ExecutiveTrendRun;
      series: Array<Record<string, unknown>>;
      points: Array<Record<string, unknown>>;
      lineage: Array<Record<string, unknown>>;
      history?: Array<Record<string, unknown>>;
    }>(`/executive/trends/runs/${id}`),
  createRun: (body: Record<string, unknown>) =>
    post<{ run: ExecutiveTrendRun }>('/executive/trends/runs', body),
  recalculateRun: (id: string, body?: Record<string, unknown>) =>
    post(`/executive/trends/runs/${id}/recalculate`, body),
  cancelRun: (id: string) =>
    post(`/executive/trends/runs/${id}/cancel`),
  archiveRun: (id: string, reason: string) =>
    post(`/executive/trends/runs/${id}/archive`, { reason }),

  // Repeat Issues
  repeatIssues: (params?: Record<string, unknown>) =>
    get<{ rows: ExecutiveRepeatIssue[]; total: number }>('/executive/trends/repeat-issues', params),
  repeats: (params?: Record<string, unknown>) =>
    get<{ rows: ExecutiveRepeatIssue[]; total: number }>('/executive/trends/repeat-issues', params),
  detectRepeats: (body?: Record<string, unknown>) =>
    post<{ run: any; candidates: ExecutiveRepeatIssue[]; status: string }>('/executive/trends/repeat-issues/detect', body),
  repeat: (id: string) =>
    get<{
      candidate: ExecutiveRepeatIssue;
      occurrences: ExecutiveRepeatOccurrence[];
      reviews: Array<Record<string, unknown>>;
      history: Array<Record<string, unknown>>;
    }>(`/executive/trends/repeat-issues/${id}`),
  confirmRepeat: (id: string, reason: string) =>
    post<ExecutiveRepeatIssue>(`/executive/trends/repeat-issues/${id}/confirm`, { reason }),
  rejectRepeat: (id: string, reason: string) =>
    post<ExecutiveRepeatIssue>(`/executive/trends/repeat-issues/${id}/reject`, { reason }),
  reviewRepeat: (id: string, action: 'confirm' | 'reject' | string, body?: Record<string, unknown>) =>
    post<ExecutiveRepeatIssue>(`/executive/trends/repeat-issues/${id}/${action === 'reject' ? 'reject' : 'confirm'}`, body),
  createRepeatAction: (id: string, body: Record<string, unknown>) =>
    post(`/executive/trends/repeat-issues/${id}/create-action`, body),
  addRepeatToManagementReview: (id: string) =>
    post(`/executive/trends/repeat-issues/${id}/add-to-management-review`),

  // Clusters
  recurringClusters: (params?: Record<string, unknown>) =>
    get<{ rows: ExecutiveRecurringCluster[]; total: number }>('/executive/trends/recurring-issues/clusters', params),
  clusters: (params?: Record<string, unknown>) =>
    get<{ rows: ExecutiveRecurringCluster[]; total: number }>('/executive/trends/recurring-issues/clusters', params),
  cluster: (id: string) =>
    get<{ cluster: ExecutiveRecurringCluster; members: Array<Record<string, unknown>> }>(
      `/executive/trends/recurring-issues/clusters/${id}`
    ),
  reviewCluster: (id: string, body: Record<string, unknown>) =>
    post<ExecutiveRecurringCluster>(`/executive/trends/recurring-issues/clusters/${id}/review`, body),
  addClusterToManagementReview: (id: string) =>
    post(`/executive/trends/recurring-issues/clusters/${id}/add-to-management-review`),

  // Alerts & Rules
  alerts: (params?: Record<string, unknown>) =>
    get<{ rows: ExecutiveTrendAlert[]; total: number }>('/executive/trends/alerts', params),
  acknowledgeAlert: (id: string) =>
    post<ExecutiveTrendAlert>(`/executive/trends/alerts/${id}/acknowledge`),
  resolveAlert: (id: string, reason: string) =>
    post<ExecutiveTrendAlert>(`/executive/trends/alerts/${id}/resolve`, { reason }),
  escalateAlert: (id: string) =>
    post(`/executive/trends/alerts/${id}/escalate`),
  alertRules: (params?: Record<string, unknown>) =>
    get<{ rows: ExecutiveTrendAlertRule[]; total: number }>('/executive/trends/alert-rules', params),
  alertRule: (id: string) =>
    get<ExecutiveTrendAlertRule>(`/executive/trends/alert-rules/${id}`),
  createAlertRule: (body: Record<string, unknown>) =>
    post<ExecutiveTrendAlertRule>('/executive/trends/alert-rules', body),
  updateAlertRule: (id: string, body: Record<string, unknown>) =>
    patch<ExecutiveTrendAlertRule>(`/executive/trends/alert-rules/${id}`, body),
  testAlertRule: (id: string, body?: Record<string, unknown>) =>
    post<{ dryRun: boolean; rule: any; matchedInsights: any[]; productionAlertsCreated: number; escalationsCreated: number }>(
      `/executive/trends/alert-rules/${id}/test`,
      body
    ),

  // Insights
  insights: (params?: Record<string, unknown>) =>
    get<{ rows: ExecutiveTrendInsight[]; total: number }>('/executive/trends/insights', params),
  reviewInsight: (id: string, reason: string, dismiss = false) =>
    post<ExecutiveTrendInsight>(`/executive/trends/insights/${id}/${dismiss ? 'dismiss' : 'review'}`, { reason }),
  addInsightToManagementReview: (id: string) =>
    post(`/executive/trends/insights/${id}/add-to-management-review`),

  // Comparisons & Governance
  comparisons: (params?: Record<string, unknown>) =>
    get<{ rows: any[]; total: number; status?: string }>('/executive/trends/compare', params),
  createComparison: (body: Record<string, unknown>) =>
    post('/executive/trends/compare', body),
  methodology: () =>
    get<Array<Record<string, unknown>>>('/executive/trends/methodology'),
  settings: () =>
    get<Record<string, unknown> | null>('/executive/trends/settings'),
  updateSettings: (body: Record<string, unknown>) =>
    patch('/executive/trends/settings', body),

  // Lookups
  lookups: (kind: string) =>
    get<string[]>(`/executive/lookups/${kind}`),
};
