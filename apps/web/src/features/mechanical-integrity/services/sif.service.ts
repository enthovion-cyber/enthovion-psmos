import type { MiSafeguardDashboardResponse, MiSafeguardRegistryResponse } from '../types/safeguard-common.types';
import type { SifDetailResponse, SifRegistryResponse } from '../types/sif.types';
import { get, patch, post, remove } from './safeguard-api';

export const sifService = {
  dashboard: (params: Record<string, unknown> = {}) => get<MiSafeguardDashboardResponse>('/mechanical-integrity/sis', params),
  summary: (params: Record<string, unknown> = {}) => get<Record<string, any>>('/mechanical-integrity/sis/summary', params),
  health: (params: Record<string, unknown> = {}) => get<Record<string, any>>('/mechanical-integrity/sis/health', params),
  due: (params: Record<string, unknown> = {}) => get<MiSafeguardRegistryResponse>('/mechanical-integrity/sis/due', params),
  overdue: (params: Record<string, unknown> = {}) => get<MiSafeguardRegistryResponse>('/mechanical-integrity/sis/overdue', params),
  failed: (params: Record<string, unknown> = {}) => get<MiSafeguardRegistryResponse>('/mechanical-integrity/sis/failed', params),
  bypassed: (params: Record<string, unknown> = {}) => get<MiSafeguardRegistryResponse>('/mechanical-integrity/sis/bypassed', params),
  registry: (params: Record<string, unknown> = {}, equipmentId?: string) => get<SifRegistryResponse>(equipmentId ? `/mechanical-integrity/equipment/${equipmentId}/safeguards` : '/mechanical-integrity/sis/sifs', params),
  get: (sifId: string) => get<SifDetailResponse>(`/mechanical-integrity/sis/sifs/${sifId}`),
  create: (input: Record<string, unknown>, equipmentId?: string) => post<SifDetailResponse>(equipmentId ? `/mechanical-integrity/equipment/${equipmentId}/sis-sif-interlocks` : '/mechanical-integrity/sis/sifs', input),
  update: (sifId: string, input: Record<string, unknown>) => patch<SifDetailResponse>(`/mechanical-integrity/sis/sifs/${sifId}`, input),
  archive: (sifId: string, reason: string) => post<SifDetailResponse>(`/mechanical-integrity/sis/sifs/${sifId}/archive`, { reason }),
  reactivate: (sifId: string, reason: string) => post<SifDetailResponse>(`/mechanical-integrity/sis/sifs/${sifId}/reactivate`, { reason }),
  devices: (sifId: string) => get<Record<string, any>>(`/mechanical-integrity/sis/sifs/${sifId}/devices`),
  addDevice: (sifId: string, input: Record<string, unknown>) => post<Record<string, any>>(`/mechanical-integrity/sis/sifs/${sifId}/devices`, input),
  updateDevice: (sifId: string, deviceId: string, input: Record<string, unknown>) => patch<Record<string, any>>(`/mechanical-integrity/sis/sifs/${sifId}/devices/${deviceId}`, input),
  removeDevice: (sifId: string, deviceId: string) => remove<Record<string, any>>(`/mechanical-integrity/sis/sifs/${sifId}/devices/${deviceId}`),
  lopaSil: (sifId: string) => get<Record<string, any>>(`/mechanical-integrity/sis/sifs/${sifId}/lopa-sil`),
  upsertLopaSil: (sifId: string, input: Record<string, unknown>) => post<Record<string, any>>(`/mechanical-integrity/sis/sifs/${sifId}/lopa-sil`, input),
  causeEffect: (sifId: string) => get<Record<string, any>>(`/mechanical-integrity/sis/sifs/${sifId}/cause-effect`),
  updateCauseEffect: (sifId: string, input: Record<string, unknown>) => patch<Record<string, any>>(`/mechanical-integrity/sis/sifs/${sifId}/cause-effect`, input),
  silData: (sifId: string) => get<Record<string, any>>(`/mechanical-integrity/sis/sifs/${sifId}/sil-data`),
  updateSilData: (sifId: string, input: Record<string, unknown>) => patch<Record<string, any>>(`/mechanical-integrity/sis/sifs/${sifId}/sil-data`, input),
  recalculateSchedule: (sifId: string) => post<Record<string, any>>(`/mechanical-integrity/sis/sifs/${sifId}/recalculate-schedule`, {}),
  importTemplate: () => get<Record<string, any>>('/mechanical-integrity/sis/sifs/import-template'),
  importRows: (input: Record<string, unknown>) => post<Record<string, any>>('/mechanical-integrity/sis/sifs/import', input),
  exportRows: (params: Record<string, unknown> = {}) => get<Record<string, any>>('/mechanical-integrity/sis/sifs/export', params),
  lookups: (type: string) => get<Record<string, any>>(`/mechanical-integrity/lookups/${type}`)
};
