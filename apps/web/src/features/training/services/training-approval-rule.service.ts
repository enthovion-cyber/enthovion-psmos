import { get, patch, post } from './training-api';
import type { TrainingApprovalPaged, TrainingApprovalRow } from '../types/training-review-approval.types';

const base = '/training-competency/review-approval/rules';

export const trainingApprovalRuleService = {
  list: (params: Record<string, unknown> = {}) => get<TrainingApprovalPaged>(base, params),
  detail: (ruleId: string) => get<TrainingApprovalRow>(`${base}/${ruleId}`),
  create: (data: Record<string, any>) => post<TrainingApprovalRow>(base, data),
  update: (ruleId: string, data: Record<string, any>) => patch<TrainingApprovalRow>(`${base}/${ruleId}`, data),
  archive: (ruleId: string, reason: string) => post<TrainingApprovalRow>(`${base}/${ruleId}/archive`, { reason }),
  activate: (ruleId: string) => post<TrainingApprovalRow>(`${base}/${ruleId}/activate`)
};
