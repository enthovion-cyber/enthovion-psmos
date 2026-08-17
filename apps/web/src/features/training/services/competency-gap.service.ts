import { get, patch, post } from './training-api';

const base = '/training-competency/roles-competency-profiles/gaps';

export const competencyGapService = {
  list: (params?: Record<string, unknown>) => get<Record<string, any>>(base, params),
  detail: (gapId: string) => get<Record<string, any>>(`${base}/${gapId}`),
  update: (gapId: string, data: Record<string, unknown>) => patch<Record<string, any>>(`${base}/${gapId}`, data),
  assign: (gapId: string, data: Record<string, unknown>) => post<Record<string, any>>(`${base}/${gapId}/assign`, data),
  createAction: (gapId: string, data?: Record<string, unknown>) => post<Record<string, any>>(`${base}/${gapId}/create-action`, data),
  resolve: (gapId: string, data: Record<string, unknown>) => post<Record<string, any>>(`${base}/${gapId}/mark-resolved`, data),
  verify: (gapId: string, data?: Record<string, unknown>) => post<Record<string, any>>(`${base}/${gapId}/verify`, data),
  reopen: (gapId: string, data: Record<string, unknown>) => post<Record<string, any>>(`${base}/${gapId}/reopen`, data)
};
