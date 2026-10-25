import { executiveApi } from './executive-api';
import type { ExecutivePerformanceList, ExecutiveScopePerformance } from '../types/executive-performance.types';

export const executiveSitePerformanceService = {
  list: (params?: Record<string, unknown>) => executiveApi.performanceScopes('site', params),
  detail: (siteId: string, params?: Record<string, unknown>) => executiveApi.performanceScope('site', siteId, params),
  recalculate: (siteId: string, payload?: Record<string, unknown>) =>
    executiveApi.performanceRecalculate({ ...payload, siteId }),
  createSnapshot: (siteId: string, payload?: Record<string, unknown>) =>
    executiveApi.createPerformanceSnapshot({ ...payload, scopeType: 'site', scopeId: siteId }),
};
