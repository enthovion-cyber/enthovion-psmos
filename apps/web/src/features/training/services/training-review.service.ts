import { get } from './training-api';
import type { TrainingApprovalDashboard, TrainingApprovalPaged, TrainingApprovalRow } from '../types/training-review-approval.types';

const base = '/training-competency/review-approval';

export const trainingReviewService = {
  dashboard: (params: Record<string, unknown> = {}) => get<TrainingApprovalDashboard>(`${base}/dashboard`, params),
  summary: (params: Record<string, unknown> = {}) => get<Record<string, any>>(`${base}/dashboard/summary`, params),
  inbox: (params: Record<string, unknown> = {}) => get<TrainingApprovalPaged>(`${base}/inbox`, params),
  submissions: (params: Record<string, unknown> = {}) => get<TrainingApprovalPaged>(`${base}/my-submissions`, params),
  filtered: (view: string, params: Record<string, unknown> = {}) => get<TrainingApprovalPaged>(`${base}/${view}`, params),
  lookups: () => get<Record<string, string[]>>('/training-competency/reports/lookups')
};

export function moduleCounts(rows?: Array<{ label: string; count: number }>) {
  return rows?.length ? rows : [{ label: 'No backend records', count: 0 }];
}
