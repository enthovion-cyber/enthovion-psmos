import { executivePsmElementApi } from './executive-psm-element.service';

export const executivePsmElementDashboardService = {
  dashboard: (params?: Record<string, unknown>) => executivePsmElementApi.dashboard(params),
  summary: async (params?: Record<string, unknown>) => {
    const data = await executivePsmElementApi.dashboard(params);
    return data?.summary ?? null;
  },
};
