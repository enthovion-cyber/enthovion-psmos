import type { TrainingDashboardResponse, TrainingSummary } from '../types/training.types';
import { get } from './training-api';

export const trainingDashboardService = {
  dashboard: (params: Record<string, unknown> = {}) => get<TrainingDashboardResponse>('/training-competency/dashboard', params),
  summary: (params: Record<string, unknown> = {}) => get<TrainingSummary>('/training-competency/dashboard/summary', params),
  readinessBySite: (params: Record<string, unknown> = {}) => get<Array<Record<string, any>>>('/training-competency/dashboard/readiness-by-site', params),
  readinessByUnit: (params: Record<string, unknown> = {}) => get<Array<Record<string, any>>>('/training-competency/dashboard/readiness-by-unit', params),
  overduePreview: (params: Record<string, unknown> = {}) => get<Array<Record<string, any>>>('/training-competency/dashboard/overdue-preview', params),
  recentHistory: () => get<{ rows: Array<Record<string, any>> }>('/training-competency/dashboard/recent-history')
};
