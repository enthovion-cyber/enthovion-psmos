import type { MiDeficiencyDetailResponse, MiDeficiencyLookups, MiDeficiencyRegistryResponse } from '../types/deficiency.types';
import { get, patch, post, remove } from './safeguard-api';

const base = '/mechanical-integrity/deficiencies';

export const deficiencyService = {
  registry: (params: Record<string, unknown> = {}) => get<MiDeficiencyRegistryResponse>(base, params),
  summary: (params: Record<string, unknown> = {}) => get<MiDeficiencyRegistryResponse['summary']>(`${base}/summary`, params),
  open: (params: Record<string, unknown> = {}) => get<MiDeficiencyRegistryResponse>(`${base}/open`, params),
  overdue: (params: Record<string, unknown> = {}) => get<MiDeficiencyRegistryResponse>(`${base}/overdue`, params),
  critical: (params: Record<string, unknown> = {}) => get<MiDeficiencyRegistryResponse>(`${base}/critical`, params),
  pendingApproval: (params: Record<string, unknown> = {}) => get<MiDeficiencyRegistryResponse>(`${base}/pending-approval`, params),
  lookups: () => get<MiDeficiencyLookups>(`${base}/lookups`),
  get: (id: string) => get<MiDeficiencyDetailResponse>(`${base}/${id}`),
  create: (input: Record<string, unknown>) => post<MiDeficiencyDetailResponse>(base, input),
  update: (id: string, input: Record<string, unknown>) => patch<MiDeficiencyDetailResponse>(`${base}/${id}`, input),
  submit: (id: string, input: Record<string, unknown> = {}) => post<MiDeficiencyDetailResponse>(`${base}/${id}/submit`, input),
  review: (id: string, input: Record<string, unknown> = {}) => post<MiDeficiencyDetailResponse>(`${base}/${id}/review`, input),
  approve: (id: string, input: Record<string, unknown> = {}) => post<MiDeficiencyDetailResponse>(`${base}/${id}/approve`, input),
  reject: (id: string, input: Record<string, unknown>) => post<MiDeficiencyDetailResponse>(`${base}/${id}/reject`, input),
  verify: (id: string, input: Record<string, unknown>) => post<MiDeficiencyDetailResponse>(`${base}/${id}/verify`, input),
  close: (id: string, input: Record<string, unknown> = {}) => post<MiDeficiencyDetailResponse>(`${base}/${id}/close`, input),
  cancel: (id: string, input: Record<string, unknown>) => post<MiDeficiencyDetailResponse>(`${base}/${id}/cancel`, input),
  linkedRecords: (id: string) => get<Array<Record<string, unknown>>>(`${base}/${id}/linked-records`),
  addLinkedRecord: (id: string, input: Record<string, unknown>) => post<Record<string, unknown>>(`${base}/${id}/linked-records`, input),
  removeLinkedRecord: (id: string, linkId: string) => remove<Record<string, unknown>>(`${base}/${id}/linked-records/${linkId}`),
  history: (id: string) => get<Array<Record<string, unknown>>>(`${base}/${id}/history`),
  importRows: (input: Record<string, unknown>) => post<Record<string, unknown>>(`${base}/import`, input),
  exportUrl: (params?: URLSearchParams) => `/api/v1${base}/export${params ? `?${params.toString()}` : ''}`,
  exportOneUrl: (id: string) => `/api/v1${base}/${id}/export`
};
