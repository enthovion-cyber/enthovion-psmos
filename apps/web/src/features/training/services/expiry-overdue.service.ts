import { get } from './training-api';

export const expiryOverdueService = {
  view: (params?: Record<string, unknown>) => get<Record<string, unknown>>('/training-competency/expiry-overdue', params),
  worker: (workerId: string, params?: Record<string, unknown>) => get<Record<string, unknown>>(`/training-competency/workforce/${workerId}/expiry-overdue`, params)
};
