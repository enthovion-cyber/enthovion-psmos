import { executivePsmElementApi } from './executive-psm-element.service';

export const executivePsmElementScoreService = {
  elements: (params?: Record<string, unknown>) => executivePsmElementApi.elements(params),
  detail: (id: string, params?: Record<string, unknown>) => executivePsmElementApi.detail(id, params),
  recalculate: (id: string, scope?: Record<string, unknown>) => executivePsmElementApi.recalculate(id, scope),
};
