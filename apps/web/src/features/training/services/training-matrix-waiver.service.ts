import { get, post } from './training-api';

export const trainingMatrixWaiverService = {
  list: (params?: Record<string, unknown>) => get<Record<string, any>>('/training-competency/training-matrix/waivers', params),
  request: (gapId: string, data: Record<string, unknown>) => post<Record<string, any>>(`/training-competency/training-matrix/gaps/${gapId}/waiver-request`, data),
  approve: (waiverId: string, data?: Record<string, unknown>) => post<Record<string, any>>(`/training-competency/training-matrix/waivers/${waiverId}/approve`, data),
  reject: (waiverId: string, data: Record<string, unknown>) => post<Record<string, any>>(`/training-competency/training-matrix/waivers/${waiverId}/reject`, data),
  revoke: (waiverId: string, data: Record<string, unknown>) => post<Record<string, any>>(`/training-competency/training-matrix/waivers/${waiverId}/revoke`, data)
};
