import { executivePsmElementApi } from './executive-psm-element.service';

export const executivePsmElementHeatmapService = {
  heatmap: (params?: Record<string, unknown>) => executivePsmElementApi.heatmap(params),
};
