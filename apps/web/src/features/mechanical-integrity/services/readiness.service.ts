import type { MiEquipmentReadinessResponse, MiReadinessDetailResponse, MiReadinessLookups, MiReadinessRegistryResponse } from '../types/readiness.types';
import { get, patch, post, remove } from './safeguard-api';

const base = '/mechanical-integrity/readiness';

export const readinessService = {
  registry: (params: Record<string, unknown> = {}) => get<MiReadinessRegistryResponse>(base, params),
  summary: (params: Record<string, unknown> = {}) => get<Record<string, number>>(`${base}/summary`, params),
  startupBlockers: (params: Record<string, unknown> = {}) => get<MiReadinessRegistryResponse>(`${base}/startup-blockers`, params),
  notFit: (params: Record<string, unknown> = {}) => get<MiReadinessRegistryResponse>(`${base}/not-fit`, params),
  fitWithRestrictions: (params: Record<string, unknown> = {}) => get<MiReadinessRegistryResponse>(`${base}/fit-with-restrictions`, params),
  pendingApproval: (params: Record<string, unknown> = {}) => get<MiReadinessRegistryResponse>(`${base}/pending-approval`, params),
  lookups: async (): Promise<MiReadinessLookups> => ({
    decisions: await get<string[]>('/mechanical-integrity/lookups/readiness-decisions'),
    statuses: await get<string[]>('/mechanical-integrity/lookups/readiness-statuses'),
    blockerTypes: await get<string[]>('/mechanical-integrity/lookups/readiness-blocker-types'),
    severities: await get<string[]>('/mechanical-integrity/lookups/readiness-severity-levels'),
    assessmentReasons: await get<string[]>('/mechanical-integrity/lookups/readiness-assessment-reasons')
  }),
  get: (id: string) => get<MiReadinessDetailResponse>(`${base}/assessments/${id}`),
  create: (input: Record<string, unknown>) => post<MiReadinessDetailResponse>(`${base}/assessments`, input),
  update: (id: string, input: Record<string, unknown>) => patch<MiReadinessDetailResponse>(`${base}/assessments/${id}`, input),
  runCheck: (id: string, input: Record<string, unknown> = {}) => post<MiReadinessDetailResponse>(`${base}/assessments/${id}/run-check`, input),
  submit: (id: string, input: Record<string, unknown> = {}) => post<MiReadinessDetailResponse>(`${base}/assessments/${id}/submit`, input),
  review: (id: string, input: Record<string, unknown> = {}) => post<MiReadinessDetailResponse>(`${base}/assessments/${id}/review`, input),
  approve: (id: string, input: Record<string, unknown> = {}) => post<MiReadinessDetailResponse>(`${base}/assessments/${id}/approve`, input),
  reject: (id: string, input: Record<string, unknown>) => post<MiReadinessDetailResponse>(`${base}/assessments/${id}/reject`, input),
  override: (id: string, input: Record<string, unknown>) => post<MiReadinessDetailResponse>(`${base}/assessments/${id}/override`, input),
  close: (id: string, input: Record<string, unknown> = {}) => post<MiReadinessDetailResponse>(`${base}/assessments/${id}/close`, input),
  addRestriction: (id: string, input: Record<string, unknown>) => post<Record<string, unknown>>(`${base}/assessments/${id}/restrictions`, input),
  updateRestriction: (id: string, restrictionId: string, input: Record<string, unknown>) => patch<Record<string, unknown>>(`${base}/assessments/${id}/restrictions/${restrictionId}`, input),
  waiveBlocker: (id: string, blockerId: string, input: Record<string, unknown>) => post<Record<string, unknown>>(`${base}/assessments/${id}/blockers/${blockerId}/waive`, input),
  clearBlocker: (id: string, blockerId: string, input: Record<string, unknown> = {}) => post<Record<string, unknown>>(`${base}/assessments/${id}/blockers/${blockerId}/clear`, input),
  createActionFromBlocker: (id: string, blockerId: string, input: Record<string, unknown>) => post<Record<string, unknown>>(`${base}/assessments/${id}/blockers/${blockerId}/create-action`, input),
  addLinkedRecord: (id: string, input: Record<string, unknown>) => post<Record<string, unknown>>(`${base}/assessments/${id}/linked-records`, input),
  removeLinkedRecord: (id: string, linkId: string) => remove<Record<string, unknown>>(`${base}/assessments/${id}/linked-records/${linkId}`),
  equipment: (equipmentId: string) => get<MiEquipmentReadinessResponse>(`/mechanical-integrity/equipment/${equipmentId}/readiness`),
  runEquipmentCheck: (equipmentId: string) => post<MiEquipmentReadinessResponse>(`/mechanical-integrity/equipment/${equipmentId}/readiness/run-check`),
  createForEquipment: (equipmentId: string, input: Record<string, unknown>) => post<MiReadinessDetailResponse>(`/mechanical-integrity/equipment/${equipmentId}/readiness/assessments`, input)
};
