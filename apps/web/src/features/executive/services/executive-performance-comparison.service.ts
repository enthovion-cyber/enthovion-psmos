import { executiveApi } from './executive-api';

export const executivePerformanceComparisonService = {
  compare: (params?: Record<string, unknown>) => executiveApi.performanceCompare(params),
  rankings: (params?: Record<string, unknown>) => executiveApi.performanceRankings(params),
};
