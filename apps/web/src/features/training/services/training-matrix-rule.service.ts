import { get, post, patch } from './training-api';

export const trainingMatrixRuleService = {
  list: (params?: Record<string, unknown>) => get<Record<string, any>>('/training-competency/training-matrix/rules', params),
  detail: (ruleId: string) => get<Record<string, any>>(`/training-competency/training-matrix/rules/${ruleId}`),
  create: (data: Record<string, unknown>) => post<Record<string, any>>('/training-competency/training-matrix/rules', data),
  update: (ruleId: string, data: Record<string, unknown>) => patch<Record<string, any>>(`/training-competency/training-matrix/rules/${ruleId}`, data),
  archive: (ruleId: string, data: Record<string, unknown>) => post<Record<string, any>>(`/training-competency/training-matrix/rules/${ruleId}/archive`, data),
  activate: (ruleId: string) => post<Record<string, any>>(`/training-competency/training-matrix/rules/${ruleId}/activate`),
  deactivate: (ruleId: string) => post<Record<string, any>>(`/training-competency/training-matrix/rules/${ruleId}/deactivate`),
  previewAffectedWorkers: (ruleId: string) => post<Record<string, any>>(`/training-competency/training-matrix/rules/${ruleId}/preview-affected-workers`)
};
