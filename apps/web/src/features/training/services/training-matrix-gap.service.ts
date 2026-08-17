import { get, post, patch } from './training-api';

export const trainingMatrixGapService = {
  list: (params?: Record<string, unknown>) => get<Record<string, any>>('/training-competency/training-matrix/gaps', params),
  overdue: (params?: Record<string, unknown>) => get<Record<string, any>>('/training-competency/training-matrix/overdue', params),
  expiring: (params?: Record<string, unknown>) => get<Record<string, any>>('/training-competency/training-matrix/expiring', params),
  safetyCritical: (params?: Record<string, unknown>) => get<Record<string, any>>('/training-competency/training-matrix/safety-critical-gaps', params),
  detail: (gapId: string) => get<Record<string, any>>(`/training-competency/training-matrix/gaps/${gapId}`),
  update: (gapId: string, data: Record<string, unknown>) => patch<Record<string, any>>(`/training-competency/training-matrix/gaps/${gapId}`, data),
  assign: (gapId: string, data: Record<string, unknown>) => post<Record<string, any>>(`/training-competency/training-matrix/gaps/${gapId}/assign`, data),
  createAction: (gapId: string, data: Record<string, unknown>) => post<Record<string, any>>(`/training-competency/training-matrix/gaps/${gapId}/create-action`, data),
  markResolved: (gapId: string, data: Record<string, unknown>) => post<Record<string, any>>(`/training-competency/training-matrix/gaps/${gapId}/mark-resolved`, data),
  verify: (gapId: string, data: Record<string, unknown>) => post<Record<string, any>>(`/training-competency/training-matrix/gaps/${gapId}/verify`, data),
  reopen: (gapId: string, data: Record<string, unknown>) => post<Record<string, any>>(`/training-competency/training-matrix/gaps/${gapId}/reopen`, data)
};
