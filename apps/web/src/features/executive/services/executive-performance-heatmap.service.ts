import { executiveApi } from './executive-api';

export const executivePerformanceHeatmapService = {
  heatmap: (params?: Record<string, unknown>) => executiveApi.performanceHeatmap(params),
};
