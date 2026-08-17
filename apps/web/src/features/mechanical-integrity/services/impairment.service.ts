import type { MiImpairmentDetailResponse, MiImpairmentLookups, MiImpairmentRegistryResponse, MiImpairmentSummary } from '../types/impairment.types';
import { get, patch, post, remove } from './safeguard-api';

const base = '/mechanical-integrity/bypass-impairments';

export const impairmentService = {
  registry: (params: Record<string, unknown> = {}) => get<MiImpairmentRegistryResponse>(base, params),
  summary: (params: Record<string, unknown> = {}) => get<MiImpairmentSummary>(`${base}/summary`, params),
  active: (params: Record<string, unknown> = {}) => get<MiImpairmentRegistryResponse>(`${base}/active`, params),
  expired: (params: Record<string, unknown> = {}) => get<MiImpairmentRegistryResponse>(`${base}/expired`, params),
  pendingApproval: (params: Record<string, unknown> = {}) => get<MiImpairmentRegistryResponse>(`${base}/pending-approval`, params),
  lookups: () => get<MiImpairmentLookups>(`${base}/lookups`),
  get: (id: string) => get<MiImpairmentDetailResponse>(`${base}/${id}`),
  create: (input: Record<string, unknown>) => post<MiImpairmentDetailResponse>(base, input),
  update: (id: string, input: Record<string, unknown>) => patch<MiImpairmentDetailResponse>(`${base}/${id}`, input),
  submit: (id: string, input: Record<string, unknown> = {}) => post<MiImpairmentDetailResponse>(`${base}/${id}/submit`, input),
  approve: (id: string, input: Record<string, unknown> = {}) => post<MiImpairmentDetailResponse>(`${base}/${id}/approve`, input),
  reject: (id: string, input: Record<string, unknown>) => post<MiImpairmentDetailResponse>(`${base}/${id}/reject`, input),
  activate: (id: string, input: Record<string, unknown> = {}) => post<MiImpairmentDetailResponse>(`${base}/${id}/activate`, input),
  requestExtension: (id: string, input: Record<string, unknown>) => post<MiImpairmentDetailResponse>(`${base}/${id}/request-extension`, input),
  approveExtension: (id: string, extensionId: string, input: Record<string, unknown> = {}) => post<MiImpairmentDetailResponse>(`${base}/${id}/extensions/${extensionId}/approve`, input),
  rejectExtension: (id: string, extensionId: string, input: Record<string, unknown>) => post<MiImpairmentDetailResponse>(`${base}/${id}/extensions/${extensionId}/reject`, input),
  restore: (id: string, input: Record<string, unknown>) => post<MiImpairmentDetailResponse>(`${base}/${id}/restore`, input),
  verifyRestoration: (id: string, input: Record<string, unknown>) => post<MiImpairmentDetailResponse>(`${base}/${id}/verify-restoration`, input),
  close: (id: string, input: Record<string, unknown> = {}) => post<MiImpairmentDetailResponse>(`${base}/${id}/close`, input),
  cancel: (id: string, input: Record<string, unknown>) => post<MiImpairmentDetailResponse>(`${base}/${id}/cancel`, input),
  linkedRecords: (id: string) => get<Array<Record<string, unknown>>>(`${base}/${id}/linked-records`),
  addLinkedRecord: (id: string, input: Record<string, unknown>) => post<Record<string, unknown>>(`${base}/${id}/linked-records`, input),
  removeLinkedRecord: (id: string, linkId: string) => remove<Record<string, unknown>>(`${base}/${id}/linked-records/${linkId}`)
};
