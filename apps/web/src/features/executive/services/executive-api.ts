import { api } from '@/services/api';
import type { ExecutiveAggregationRun, ExecutiveAggregationRunDetail, ExecutiveCriticalAlert, ExecutiveDashboard, ExecutiveKpiDefinition, ExecutiveKpiResult, ExecutiveModuleHealth, ExecutiveModuleHealthDetail, ExecutiveSitePerformance } from '../types/executive-kpi.types';
import type { ExecutivePerformanceDashboard, ExecutivePerformanceList, ExecutiveScopePerformance, ExecutiveScopeType } from '../types/executive-performance.types';

function unwrap<T>(response: { data: T | { data?: T } }) { const body = response.data as { data?: T }; return body && typeof body === 'object' && 'data' in body ? body.data as T : response.data as T; }
const get = async <T>(path: string, params?: Record<string, unknown>) => unwrap<T>(await api.get(path, { params }));
const post = async <T>(path: string, body?: Record<string, unknown>) => unwrap<T>(await api.post(path, body ?? {}));
const patch = async <T>(path: string, body?: Record<string, unknown>) => unwrap<T>(await api.patch(path, body ?? {}));
const performanceCollection = (type: Exclude<ExecutiveScopeType, 'company'>) => type === 'equipment' ? 'equipment' : `${type}s`;

export const executiveApi = {
  dashboard: (params?: Record<string, unknown>) => get<ExecutiveDashboard>('/executive/dashboard', params),
  runAggregation: (scope?: Record<string, unknown>) => post<ExecutiveAggregationRunDetail>('/executive/aggregation/run', scope),
  aggregationRuns: (params?: Record<string, unknown>) => get<{ rows: ExecutiveAggregationRun[]; total: number }>('/executive/aggregation/runs', params),
  aggregationRun: (id: string) => get<ExecutiveAggregationRunDetail>(`/executive/aggregation/runs/${id}`),
  phase2Modules: (params?: Record<string, unknown>) => get<ExecutiveModuleHealth[]>('/executive/module-health', params),
  phase2Module: (key: string, params?: Record<string, unknown>) => get<ExecutiveModuleHealthDetail>(`/executive/module-health/${key}`, params),
  recalculateModule: (key: string, scope?: Record<string, unknown>) => post<ExecutiveAggregationRunDetail>(`/executive/module-health/${key}/recalculate`, scope),
  phase2Alerts: (params?: Record<string, unknown>) => get<ExecutiveCriticalAlert[]>('/executive/critical-alerts/by-module', params),
  resolveAlert: (id: string, reason: string) => post<ExecutiveCriticalAlert>(`/executive/critical-alerts/${id}/resolve`, { reason }),
  phase2Sites: (params?: Record<string, unknown>) => get<ExecutiveSitePerformance[]>('/executive/site-performance', params),
  units: (params?: Record<string, unknown>) => get<Array<Record<string, unknown>>>('/executive/unit-performance', params),
  sourceConfigs: () => get<Array<Record<string, unknown>>>('/executive/source-configs'),
  updateSourceConfig: (id: string, payload: Record<string, unknown>) => patch<Record<string, unknown>>(`/executive/source-configs/${id}`, payload),
  aggregationErrors: () => get<Array<Record<string, unknown>>>('/executive/aggregation-errors'),
  resolveAggregationError: (id: string, reason: string) => post<Record<string, unknown>>(`/executive/aggregation-errors/${id}/resolve`, { reason }),
  refresh: (scope?: Record<string, unknown>) => post<{ results: ExecutiveKpiResult[] }>('/executive/kpis/refresh', scope),
  kpis: (params?: Record<string, unknown>) => get<{ rows: ExecutiveKpiResult[]; total: number }>('/executive/kpis', params),
  definitions: (params?: Record<string, unknown>) => get<{ rows: ExecutiveKpiDefinition[]; total: number }>('/executive/kpis/definitions', params),
  kpi: (id: string, params?: Record<string, unknown>) => get<{ definition: ExecutiveKpiDefinition; result: ExecutiveKpiResult; sourceTrace: Record<string, unknown>; drilldown: { route: string | null; status: string; reason?: string | null } }>(`/executive/kpis/${id}`, params),
  modules: (params?: Record<string, unknown>) => get<ExecutiveModuleHealth[]>('/executive/modules', params),
  sites: (params?: Record<string, unknown>) => get<ExecutiveSitePerformance[]>('/executive/sites', params),
  snapshots: () => get<{ rows: Array<Record<string, unknown>>; total: number }>('/executive/snapshots'),
  createSnapshot: (payload?: Record<string, unknown>) => post<Record<string, unknown>>('/executive/snapshots', payload),
  snapshot: (id: string) => get<{ snapshot: Record<string, unknown>; results: ExecutiveKpiResult[] | null }>(`/executive/snapshots/${id}`),
  snapshotResults: (id: string) => get<{ snapshotId: string; results: ExecutiveKpiResult[] }>(`/executive/snapshots/${id}/results`),
  snapshotSourceTrace: (id: string) => get<{ snapshotId: string; sourceTrace: Array<Record<string, unknown>>; dataQualityStatus: string }>(`/executive/snapshots/${id}/source-trace`),
  sourceHealth: () => get<ExecutiveDashboard['sourceHealth']>('/executive/source-health'),
  thresholds: () => get<Array<Record<string, unknown>>>('/executive/thresholds'),
  updateThreshold: (definitionId: string, payload: Record<string, unknown>) => patch<Record<string, unknown>>(`/executive/thresholds/${definitionId}`, payload),
  settings: () => get<Record<string, unknown> | null>('/executive/settings'),
  updateSettings: (payload: Record<string, unknown>) => patch<Record<string, unknown>>('/executive/settings', payload),
  layouts: () => get<Array<Record<string, unknown>> | null>('/executive/layouts'),
  saveLayout: (payload: Record<string, unknown>) => post<Record<string, unknown>>('/executive/layouts', payload),
  updateLayout: (id: string, payload: Record<string, unknown>) => patch<Record<string, unknown>>(`/executive/layouts/${id}`, payload),
  widgets: () => get<Array<Record<string, unknown>>>('/executive/widgets')
  ,performanceDashboard: (params?: Record<string, unknown>) => get<ExecutivePerformanceDashboard>('/executive/performance/dashboard', params)
  ,performanceCompany: (params?: Record<string, unknown>) => get<ExecutiveScopePerformance>('/executive/performance/company', params)
  ,performanceScopes: (type: Exclude<ExecutiveScopeType, 'company'>, params?: Record<string, unknown>) => get<ExecutivePerformanceList>(`/executive/performance/${performanceCollection(type)}`, params)
  ,performanceScope: (type: Exclude<ExecutiveScopeType, 'company'>, id: string, params?: Record<string, unknown>) => get<ExecutiveScopePerformance>(`/executive/performance/${performanceCollection(type)}/${id}`, params)
  ,performanceRecalculate: (payload?: Record<string, unknown>) => post<Record<string, unknown>>('/executive/performance/recalculate', payload)
  ,performanceCompare: (params?: Record<string, unknown>) => get<Record<string, unknown>>('/executive/performance/compare', params)
  ,performanceHeatmap: (params?: Record<string, unknown>) => get<{ cells: Array<Record<string, unknown>> }>('/executive/performance/heatmap', params)
  ,performanceRankings: (params?: Record<string, unknown>) => get<Record<string, unknown>>('/executive/performance/rankings', params)
  ,performanceDrilldown: (params?: Record<string, unknown>) => get<Record<string, unknown>>('/executive/performance/drilldown', params)
  ,performanceSnapshots: (params?: Record<string, unknown>) => get<{ rows: Array<Record<string, unknown>>; total: number }>('/executive/performance/snapshots', params)
  ,createPerformanceSnapshot: (payload?: Record<string, unknown>) => post<Record<string, unknown>>('/executive/performance/snapshots', payload)
};
