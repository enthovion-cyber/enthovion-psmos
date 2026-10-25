import { executiveApi } from './executive-api';

export const executivePerformanceSnapshotService = {
  list: (params?: Record<string, unknown>) => executiveApi.performanceSnapshots(params),
  create: (payload?: Record<string, unknown>) => executiveApi.createPerformanceSnapshot(payload),
};
