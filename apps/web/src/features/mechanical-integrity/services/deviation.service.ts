import type { MiDeviationDetailResponse, MiDeviationRegistryResponse } from '../types/deficiency.types';
import { get, patch, post } from './safeguard-api';

const base = '/mechanical-integrity/deviations';

export const deviationService = {
  registry: (params: Record<string, unknown> = {}) => get<MiDeviationRegistryResponse>(base, params),
  get: (id: string) => get<MiDeviationDetailResponse>(`${base}/${id}`),
  create: (input: Record<string, unknown>) => post<MiDeviationDetailResponse>(base, input),
  update: (id: string, input: Record<string, unknown>) => patch<MiDeviationDetailResponse>(`${base}/${id}`, input),
  submit: (id: string, input: Record<string, unknown> = {}) => post<MiDeviationDetailResponse>(`${base}/${id}/submit`, input),
  approve: (id: string, input: Record<string, unknown> = {}) => post<MiDeviationDetailResponse>(`${base}/${id}/approve`, input),
  reject: (id: string, input: Record<string, unknown>) => post<MiDeviationDetailResponse>(`${base}/${id}/reject`, input),
  requestExtension: (id: string, input: Record<string, unknown>) => post<MiDeviationDetailResponse>(`${base}/${id}/request-extension`, input),
  approveExtension: (id: string, input: Record<string, unknown>) => post<MiDeviationDetailResponse>(`${base}/${id}/approve-extension`, input),
  close: (id: string, input: Record<string, unknown>) => post<MiDeviationDetailResponse>(`${base}/${id}/close`, input)
};
