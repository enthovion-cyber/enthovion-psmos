import { get, patch } from './training-api';
import type { TrainingApprovalPaged } from '../types/training-review-approval.types';

const base = '/training-competency/review-approval';

export const trainingApprovalSettingsService = {
  settings: (params: Record<string, unknown> = {}) => get<Record<string, any>>(`${base}/settings`, params),
  updateSettings: (data: Record<string, any>) => patch<Record<string, any>>(`${base}/settings`, data),
  esignatures: (params: Record<string, unknown> = {}) => get<TrainingApprovalPaged>(`${base}/esignatures`, params),
  escalations: (params: Record<string, unknown> = {}) => get<TrainingApprovalPaged>(`${base}/escalations`, params)
};
