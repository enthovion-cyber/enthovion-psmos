import { api } from '@/services/api';
import type { PsmElement, PsmElementDashboard, PsmElementDetail, PsmElementGap, PsmElementInput, PsmElementRow, PsmElementSnapshot, PsmKpiMapping, PsmModuleMapping } from '../types/executive-psm-element.types';

type Envelope<T> = { data: T | { data?: T } };
const unwrap = <T>(response: Envelope<T>) => { const body = response.data as { data?: T }; return body && typeof body === 'object' && 'data' in body ? body.data as T : response.data as T; };
const get = async <T>(path: string, params?: Record<string, unknown>) => unwrap<T>(await api.get(path, { params }));
const post = async <T>(path: string, body?: Record<string, unknown>) => unwrap<T>(await api.post(path, body ?? {}));
const patch = async <T>(path: string, body?: Record<string, unknown>) => unwrap<T>(await api.patch(path, body ?? {}));

export const executivePsmElementApi = {
  dashboard: (params?: Record<string, unknown>) => get<PsmElementDashboard>('/executive/psm-elements/dashboard', params),
  elements: (params?: Record<string, unknown>) => get<{ rows: PsmElementRow[]; total: number }>('/executive/psm-elements/register', params),
  detail: (id: string, params?: Record<string, unknown>) => get<PsmElementDetail>(`/executive/psm-elements/${id}`, params),
  create: (input: PsmElementInput) => post<PsmElement>('/executive/psm-elements', input),
  update: (id: string, input: Partial<PsmElementInput>) => patch<PsmElement>(`/executive/psm-elements/${id}`, input),
  archive: (id: string, body: { reason: string }) => post<PsmElement>(`/executive/psm-elements/${id}/archive`, body),
  recalculate: (id: string, scope?: Record<string, unknown>) => post(`/executive/psm-elements/${id}/recalculate`, scope),
  heatmap: (params?: Record<string, unknown>) => get<{ cells: Array<{ elementId: string; elementName: string; score: number | null; status: string; criticalCount: number; overdueCount: number; restricted: boolean; drilldownRoute: string }> }>('/executive/psm-elements/heatmap', params),
  gaps: (params?: Record<string, unknown>) => get<PsmElementGap[]>('/executive/psm-elements/gaps', params),
  breakdown: (type: 'site' | 'unit', params?: Record<string, unknown>) => get<Array<Record<string, unknown>>>(`/executive/psm-elements/${type}-breakdown`, params),
  snapshots: (params?: Record<string, unknown>) => get<{ rows: PsmElementSnapshot[]; total: number }>('/executive/psm-elements/snapshots', params),
  snapshot: (id: string) => get<PsmElementSnapshot>(`/executive/psm-elements/snapshots/${id}`),
  createSnapshot: (body?: Record<string, unknown>) => post<PsmElementSnapshot>('/executive/psm-elements/snapshots', body),
  archiveSnapshot: (id: string, reason: string) => post<PsmElementSnapshot>(`/executive/psm-elements/snapshots/${id}/archive`, { reason }),
  mappings: (params?: Record<string, unknown>) => get<PsmModuleMapping[]>('/executive/psm-elements/mapping', params),
  createMapping: (input: Record<string, unknown>) => post<PsmModuleMapping>('/executive/psm-elements/mapping', input),
  updateMapping: (id: string, input: Record<string, unknown>) => patch<PsmModuleMapping>(`/executive/psm-elements/mapping/${id}`, input),
  kpiMappings: (params?: Record<string, unknown>) => get<PsmKpiMapping[]>('/executive/psm-elements/kpi-mappings', params),
  createKpiMapping: (input: Record<string, unknown>) => post<PsmKpiMapping>('/executive/psm-elements/kpi-mappings', input),
  updateKpiMapping: (id: string, input: Record<string, unknown>) => patch<PsmKpiMapping>(`/executive/psm-elements/kpi-mappings/${id}`, input),
  settings: () => get<Record<string, unknown> | null>('/executive/psm-elements/settings'),
  updateSettings: (input: Record<string, unknown>) => patch<Record<string, unknown>>('/executive/psm-elements/settings', input)
};
