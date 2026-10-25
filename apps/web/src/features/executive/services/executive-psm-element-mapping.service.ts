import { executivePsmElementApi } from './executive-psm-element.service';

export const executivePsmElementMappingService = {
  mappings: (params?: Record<string, unknown>) => executivePsmElementApi.mappings(params),
  createMapping: (input: Record<string, unknown>) => executivePsmElementApi.createMapping(input),
  updateMapping: (id: string, input: Record<string, unknown>) => executivePsmElementApi.updateMapping(id, input),
  kpiMappings: (params?: Record<string, unknown>) => executivePsmElementApi.kpiMappings(params),
  createKpiMapping: (input: Record<string, unknown>) => executivePsmElementApi.createKpiMapping(input),
  updateKpiMapping: (id: string, input: Record<string, unknown>) => executivePsmElementApi.updateKpiMapping(id, input),
};
