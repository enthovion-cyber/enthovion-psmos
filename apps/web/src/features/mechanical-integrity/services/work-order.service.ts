import type { MiWorkOrderDetailResponse, MiWorkOrderLookups, MiWorkOrderRegistryResponse } from '../types/work-order.types';
import { get, patch, post, remove } from './safeguard-api';

const base = '/mechanical-integrity/work-orders';

export const workOrderService = {
  registry: (params: Record<string, unknown> = {}) => get<MiWorkOrderRegistryResponse>(base, params),
  summary: (params: Record<string, unknown> = {}) => get<MiWorkOrderRegistryResponse['summary']>(`${base}/summary`, params),
  open: (params: Record<string, unknown> = {}) => get<MiWorkOrderRegistryResponse>(`${base}/open`, params),
  overdue: (params: Record<string, unknown> = {}) => get<MiWorkOrderRegistryResponse>(`${base}/overdue`, params),
  safetyCritical: (params: Record<string, unknown> = {}) => get<MiWorkOrderRegistryResponse>(`${base}/safety-critical`, params),
  pendingVerification: (params: Record<string, unknown> = {}) => get<MiWorkOrderRegistryResponse>(`${base}/pending-verification`, params),
  lookups: () => get<string[]>('/mechanical-integrity/lookups/work-order-types').then(async (workOrderTypes) => ({
    workOrderTypes,
    actionTypes: await get<string[]>('/mechanical-integrity/lookups/action-types'),
    workCategories: await get<string[]>('/mechanical-integrity/lookups/work-categories'),
    workStatuses: await get<string[]>('/mechanical-integrity/lookups/work-order-statuses'),
    priorities: await get<string[]>('/mechanical-integrity/lookups/work-priorities'),
    riskLevels: await get<string[]>('/mechanical-integrity/lookups/work-risk-levels'),
    partsStatuses: await get<string[]>('/mechanical-integrity/lookups/parts-statuses')
  })),
  get: (id: string) => get<MiWorkOrderDetailResponse>(`${base}/${id}`),
  create: (input: Record<string, unknown>) => post<MiWorkOrderDetailResponse>(base, input),
  update: (id: string, input: Record<string, unknown>) => patch<MiWorkOrderDetailResponse>(`${base}/${id}`, input),
  importRows: (input: Record<string, unknown>) => post<Record<string, unknown>>(`${base}/import`, input),
  exportUrl: (params?: URLSearchParams) => `/api/v1${base}/export${params ? `?${params.toString()}` : ''}`,
  exportOneUrl: (id: string) => `/api/v1${base}/${id}/export`,
  submit: (id: string, input: Record<string, unknown> = {}) => post<MiWorkOrderDetailResponse>(`${base}/${id}/submit`, input),
  approve: (id: string, input: Record<string, unknown> = {}) => post<MiWorkOrderDetailResponse>(`${base}/${id}/approve`, input),
  reject: (id: string, input: Record<string, unknown>) => post<MiWorkOrderDetailResponse>(`${base}/${id}/reject`, input),
  plan: (id: string, input: Record<string, unknown>) => post<MiWorkOrderDetailResponse>(`${base}/${id}/plan`, input),
  assign: (id: string, input: Record<string, unknown>) => post<MiWorkOrderDetailResponse>(`${base}/${id}/assign`, input),
  start: (id: string, input: Record<string, unknown> = {}) => post<MiWorkOrderDetailResponse>(`${base}/${id}/start`, input),
  hold: (id: string, input: Record<string, unknown>) => post<MiWorkOrderDetailResponse>(`${base}/${id}/hold`, input),
  resume: (id: string, input: Record<string, unknown> = {}) => post<MiWorkOrderDetailResponse>(`${base}/${id}/resume`, input),
  complete: (id: string, input: Record<string, unknown>) => post<MiWorkOrderDetailResponse>(`${base}/${id}/complete`, input),
  verify: (id: string, input: Record<string, unknown>) => post<MiWorkOrderDetailResponse>(`${base}/${id}/verify`, input),
  close: (id: string, input: Record<string, unknown> = {}) => post<MiWorkOrderDetailResponse>(`${base}/${id}/close`, input),
  cancel: (id: string, input: Record<string, unknown>) => post<MiWorkOrderDetailResponse>(`${base}/${id}/cancel`, input),
  tasks: (id: string) => get<Array<Record<string, unknown>>>(`${base}/${id}/tasks`),
  addTask: (id: string, input: Record<string, unknown>) => post<Record<string, unknown>>(`${base}/${id}/tasks`, input),
  updateTask: (id: string, taskId: string, input: Record<string, unknown>) => patch<Record<string, unknown>>(`${base}/${id}/tasks/${taskId}`, input),
  deleteTask: (id: string, taskId: string) => remove<Record<string, unknown>>(`${base}/${id}/tasks/${taskId}`),
  parts: (id: string) => get<Array<Record<string, unknown>>>(`${base}/${id}/parts`),
  addPart: (id: string, input: Record<string, unknown>) => post<Record<string, unknown>>(`${base}/${id}/parts`, input),
  updatePart: (id: string, partId: string, input: Record<string, unknown>) => patch<Record<string, unknown>>(`${base}/${id}/parts/${partId}`, input),
  addLinkedRecord: (id: string, input: Record<string, unknown>) => post<Record<string, unknown>>(`${base}/${id}/linked-records`, input),
  removeLinkedRecord: (id: string, linkId: string) => remove<Record<string, unknown>>(`${base}/${id}/linked-records/${linkId}`),
  createAction: (id: string, input: Record<string, unknown>) => post<Record<string, unknown>>(`${base}/${id}/create-action`, input),
  linkAction: (id: string, input: Record<string, unknown>) => post<Record<string, unknown>>(`${base}/${id}/link-action`, input)
};
