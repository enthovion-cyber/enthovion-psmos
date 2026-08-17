import type { CriticalAlarmDetailResponse, CriticalAlarmRegistryResponse } from '../types/critical-alarm.types';
import { get, patch, post } from './safeguard-api';

export const criticalAlarmService = {
  registry: (params: Record<string, unknown> = {}, equipmentId?: string) => get<CriticalAlarmRegistryResponse>(equipmentId ? `/mechanical-integrity/equipment/${equipmentId}/critical-alarms` : '/mechanical-integrity/critical-alarms', params),
  get: (alarmId: string) => get<CriticalAlarmDetailResponse>(`/mechanical-integrity/critical-alarms/${alarmId}`),
  create: (input: Record<string, unknown>) => post<CriticalAlarmDetailResponse>('/mechanical-integrity/critical-alarms', input),
  update: (alarmId: string, input: Record<string, unknown>) => patch<CriticalAlarmDetailResponse>(`/mechanical-integrity/critical-alarms/${alarmId}`, input),
  archive: (alarmId: string, reason: string) => post<CriticalAlarmDetailResponse>(`/mechanical-integrity/critical-alarms/${alarmId}/archive`, { reason }),
  reactivate: (alarmId: string, reason: string) => post<CriticalAlarmDetailResponse>(`/mechanical-integrity/critical-alarms/${alarmId}/reactivate`, { reason }),
  recalculateSchedule: (alarmId: string) => post<Record<string, any>>(`/mechanical-integrity/critical-alarms/${alarmId}/recalculate-schedule`, {}),
  importTemplate: () => get<Record<string, any>>('/mechanical-integrity/critical-alarms/import-template'),
  importRows: (input: Record<string, unknown>) => post<Record<string, any>>('/mechanical-integrity/critical-alarms/import', input),
  exportRows: (params: Record<string, unknown> = {}) => get<Record<string, any>>('/mechanical-integrity/critical-alarms/export', params)
};
