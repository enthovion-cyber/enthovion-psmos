import { executiveApi } from './executive-api';
import type { ExecutivePerformanceList, ExecutiveScopePerformance } from '../types/executive-performance.types';

export const executiveUnitPerformanceService = {
  list: (params?: Record<string, unknown>) => executiveApi.performanceScopes('unit', params),
  detail: (unitId: string, params?: Record<string, unknown>) => executiveApi.performanceScope('unit', unitId, params),
  recalculate: (unitId: string, payload?: Record<string, unknown>) =>
    executiveApi.performanceRecalculate({ ...payload, unitId }),
  createSnapshot: (unitId: string, payload?: Record<string, unknown>) =>
    executiveApi.createPerformanceSnapshot({ ...payload, scopeType: 'unit', scopeId: unitId }),
};
