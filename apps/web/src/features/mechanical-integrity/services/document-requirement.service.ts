import { get, patch, post } from './safeguard-api';

const base = '/mechanical-integrity/documents';

export const miDocumentRequirementService = {
  list: (params: Record<string, unknown> = {}) => get<Array<Record<string, unknown>>>(`${base}/requirements`, params),
  create: (input: Record<string, unknown>) => post<Record<string, unknown>>(`${base}/requirements`, input),
  update: (id: string, input: Record<string, unknown>) => patch<Record<string, unknown>>(`${base}/requirements/${id}`, input),
  archive: (id: string) => post<Record<string, unknown>>(`${base}/requirements/${id}/archive`),
  requestWaiver: (id: string, input: Record<string, unknown>) => post<Record<string, unknown>>(`${base}/requirements/${id}/request-waiver`, input),
  approveWaiver: (id: string, input: Record<string, unknown>) => post<Record<string, unknown>>(`${base}/waivers/${id}/approve`, input),
  rejectWaiver: (id: string, input: Record<string, unknown>) => post<Record<string, unknown>>(`${base}/waivers/${id}/reject`, input)
};
