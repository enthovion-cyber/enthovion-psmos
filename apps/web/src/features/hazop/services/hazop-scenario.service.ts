import { api } from '@/services/api';
import {
  hazopBulkGenerateScenariosSchema,
  hazopLopaReasonSchema,
  hazopRiskAcceptanceSchema,
  hazopRiskUpdateSchema,
  hazopSafeguardSchema,
  hazopScenarioSchema
} from '../schemas/hazop-scenario.schema';

function unwrap<T>(response: { data: { data: T } }) {
  return response.data.data;
}

export const hazopScenarioService = {
  list: (studyId: string) => api.get(`/hazop/${studyId}/scenarios`).then(unwrap<any[]>),
  add: (studyId: string, values: Record<string, any>) => api.post(`/hazop/${studyId}/scenarios`, hazopScenarioSchema.parse(values)).then(unwrap<any>),
  addToNode: (studyId: string, nodeId: string, values: Record<string, any>) => api.post(`/hazop/${studyId}/nodes/${nodeId}/scenarios`, hazopScenarioSchema.parse({ ...values, nodeId })).then(unwrap<any>),
  update: (studyId: string, scenarioId: string, values: Record<string, any>) => api.patch(`/hazop/${studyId}/scenarios/${scenarioId}`, hazopScenarioSchema.partial().parse(values)).then(unwrap<any>),
  delete: (studyId: string, scenarioId: string) => api.delete(`/hazop/${studyId}/scenarios/${scenarioId}`).then(unwrap<any>),
  duplicate: (studyId: string, scenarioId: string) => api.post(`/hazop/${studyId}/scenarios/${scenarioId}/duplicate`).then(unwrap<any>),
  bulkGenerate: (studyId: string, values: Record<string, any>) => api.post(`/hazop/${studyId}/scenarios/bulk-generate`, hazopBulkGenerateScenariosSchema.parse(values)).then(unwrap<any>),
  close: (studyId: string, scenarioId: string) => api.post(`/hazop/${studyId}/scenarios/${scenarioId}/close`).then(unwrap<any>),
  markLopaRequired: (studyId: string, scenarioId: string, reason: string) => api.post(`/hazop/${studyId}/scenarios/${scenarioId}/mark-lopa-required`, hazopLopaReasonSchema.parse({ reason })).then(unwrap<any>),
  clearLopaRequired: (studyId: string, scenarioId: string, reason: string) => api.post(`/hazop/${studyId}/scenarios/${scenarioId}/clear-lopa-required`, hazopLopaReasonSchema.parse({ reason })).then(unwrap<any>),
  addSafeguard: (studyId: string, scenarioId: string, values: Record<string, any>) => api.post(`/hazop/${studyId}/scenarios/${scenarioId}/safeguards`, hazopSafeguardSchema.parse(values)).then(unwrap<any>),
  updateRisk: (studyId: string, scenarioId: string, values: Record<string, any>) => api.patch(`/hazop/${studyId}/scenarios/${scenarioId}/risk`, hazopRiskUpdateSchema.parse(values)).then(unwrap<any>),
  recalculateRisk: (studyId: string, scenarioId: string) => api.post(`/hazop/${studyId}/scenarios/${scenarioId}/risk/recalculate`).then(unwrap<any>),
  requestRiskAcceptance: (studyId: string, scenarioId: string, values: Record<string, any>) => api.post(`/hazop/${studyId}/scenarios/${scenarioId}/risk-acceptance`, hazopRiskAcceptanceSchema.parse(values)).then(unwrap<any>),
  updateRiskAcceptance: (studyId: string, acceptanceId: string, values: Record<string, any>) => api.patch(`/hazop/${studyId}/risk-acceptance/${acceptanceId}`, hazopRiskAcceptanceSchema.parse(values)).then(unwrap<any>),
  approveRiskAcceptance: (studyId: string, acceptanceId: string, values?: Record<string, any>) => api.post(`/hazop/${studyId}/risk-acceptance/${acceptanceId}/approve`, values ?? {}).then(unwrap<any>),
  rejectRiskAcceptance: (studyId: string, acceptanceId: string, values?: Record<string, any>) => api.post(`/hazop/${studyId}/risk-acceptance/${acceptanceId}/reject`, values ?? {}).then(unwrap<any>),
  expireRiskAcceptance: (studyId: string, acceptanceId: string, values?: Record<string, any>) => api.post(`/hazop/${studyId}/risk-acceptance/${acceptanceId}/expire`, values ?? {}).then(unwrap<any>)
};
