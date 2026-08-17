import type { InterlockDetailResponse, InterlockRegistryResponse } from '../types/interlock.types';
import { get, patch, post } from './safeguard-api';

export const interlockService = {
  registry: (params: Record<string, unknown> = {}, equipmentId?: string) => get<InterlockRegistryResponse>(equipmentId ? `/mechanical-integrity/equipment/${equipmentId}/interlocks` : '/mechanical-integrity/interlocks', params),
  get: (interlockId: string) => get<InterlockDetailResponse>(`/mechanical-integrity/interlocks/${interlockId}`),
  create: (input: Record<string, unknown>) => post<InterlockDetailResponse>('/mechanical-integrity/interlocks', input),
  update: (interlockId: string, input: Record<string, unknown>) => patch<InterlockDetailResponse>(`/mechanical-integrity/interlocks/${interlockId}`, input),
  archive: (interlockId: string, reason: string) => post<InterlockDetailResponse>(`/mechanical-integrity/interlocks/${interlockId}/archive`, { reason }),
  reactivate: (interlockId: string, reason: string) => post<InterlockDetailResponse>(`/mechanical-integrity/interlocks/${interlockId}/reactivate`, { reason }),
  recalculateSchedule: (interlockId: string) => post<Record<string, any>>(`/mechanical-integrity/interlocks/${interlockId}/recalculate-schedule`, {}),
  importTemplate: () => get<Record<string, any>>('/mechanical-integrity/interlocks/import-template'),
  importRows: (input: Record<string, unknown>) => post<Record<string, any>>('/mechanical-integrity/interlocks/import', input),
  exportRows: (params: Record<string, unknown> = {}) => get<Record<string, any>>('/mechanical-integrity/interlocks/export', params)
};
