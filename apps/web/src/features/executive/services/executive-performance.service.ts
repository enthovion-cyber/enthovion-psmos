import { executiveApi } from './executive-api';
import type { ExecutivePerformanceDashboard, ExecutiveScopePerformance } from '../types/executive-performance.types';

export const executivePerformanceService = {
  dashboard: (params?: Record<string, unknown>) => executiveApi.performanceDashboard(params),
  company: (params?: Record<string, unknown>) => executiveApi.performanceCompany(params),
  recalculate: (payload?: Record<string, unknown>) => executiveApi.performanceRecalculate(payload),
  drilldown: (params?: Record<string, unknown>) => executiveApi.performanceDrilldown(params),
  rankings: (params?: Record<string, unknown>) => executiveApi.performanceRankings(params),
  heatmap: (params?: Record<string, unknown>) => executiveApi.performanceHeatmap(params),
  compare: (params?: Record<string, unknown>) => executiveApi.performanceCompare(params),
  snapshots: (params?: Record<string, unknown>) => executiveApi.performanceSnapshots(params),
  createSnapshot: (payload?: Record<string, unknown>) => executiveApi.createPerformanceSnapshot(payload),
};
