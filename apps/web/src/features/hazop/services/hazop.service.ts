import { api } from '@/services/api';
import { hazopNodeService } from './hazop-node.service';
import { hazopScenarioService } from './hazop-scenario.service';

function unwrap<T>(response: { data: { data: T } }) {
  return response.data.data;
}

export const hazopService = {
  list: (params?: Record<string, any>) => api.get('/hazop', { params }).then(unwrap<any[]>),
  dashboard: () => api.get('/hazop/dashboard').then(unwrap<any>),
  context: () => api.get('/hazop/new/context').then(unwrap<any>),
  get: (id: string) => api.get(`/hazop/${id}`).then(unwrap<any>),
  create: (values: Record<string, any>) => api.post('/hazop', values).then(unwrap<any>),
  update: (id: string, values: Record<string, any>) => api.patch(`/hazop/${id}`, values).then(unwrap<any>),
  transition: (id: string, action: string, body?: Record<string, any>) => api.post(`/hazop/${id}/${action}`, body ?? {}).then(unwrap<any>),
  addNode: hazopNodeService.add,
  nodesContext: hazopNodeService.context,
  updateNode: hazopNodeService.update,
  deleteNode: hazopNodeService.delete,
  duplicateNode: hazopNodeService.duplicate,
  reorderNodes: hazopNodeService.reorder,
  markNodeComplete: hazopNodeService.markComplete,
  reopenNode: hazopNodeService.reopen,
  createCustomNodeParameter: hazopNodeService.createCustomParameter,
  addScenario: hazopScenarioService.add,
  addScenarioToNode: hazopScenarioService.addToNode,
  updateScenario: hazopScenarioService.update,
  deleteScenario: hazopScenarioService.delete,
  duplicateScenario: hazopScenarioService.duplicate,
  bulkGenerateScenarios: hazopScenarioService.bulkGenerate,
  markScenarioLopaRequired: hazopScenarioService.markLopaRequired,
  clearScenarioLopaRequired: hazopScenarioService.clearLopaRequired,
  riskSummary: (id: string) => api.get(`/hazop/${id}/risk/summary`).then(unwrap<any>),
  riskMatrix: (id: string) => api.get(`/hazop/${id}/risk/matrix`).then(unwrap<any>),
  riskRegister: (id: string, params?: Record<string, any>) => api.get(`/hazop/${id}/risk/register`, { params }).then(unwrap<any>),
  highCriticalRisk: (id: string) => api.get(`/hazop/${id}/risk/high-critical`).then(unwrap<any[]>),
  lopaTriggers: (id: string) => api.get(`/hazop/${id}/risk/lopa-triggers`).then(unwrap<any[]>),
  riskHistory: (id: string, params?: Record<string, any>) => api.get(`/hazop/${id}/risk/history`, { params }).then(unwrap<any[]>),
  riskAcceptances: (id: string) => api.get(`/hazop/${id}/risk/acceptances`).then(unwrap<any[]>),
  updateScenarioRisk: hazopScenarioService.updateRisk,
  recalculateScenarioRisk: hazopScenarioService.recalculateRisk,
  requestRiskAcceptance: hazopScenarioService.requestRiskAcceptance,
  updateRiskAcceptance: hazopScenarioService.updateRiskAcceptance,
  approveRiskAcceptance: hazopScenarioService.approveRiskAcceptance,
  rejectRiskAcceptance: hazopScenarioService.rejectRiskAcceptance,
  expireRiskAcceptance: hazopScenarioService.expireRiskAcceptance,
  bulkUpdateRiskOwner: (id: string, values: Record<string, any>) => api.post(`/hazop/${id}/risk/bulk-update-owner`, values).then(unwrap<any>),
  bulkMarkLopaRequired: (id: string, values: Record<string, any>) => api.post(`/hazop/${id}/risk/bulk-mark-lopa-required`, values).then(unwrap<any>),
  exportRiskRegister: (id: string) => api.post(`/hazop/${id}/risk/export`).then(unwrap<any>),
  closeScenario: hazopScenarioService.close,
  addSafeguard: hazopScenarioService.addSafeguard,
  addRecommendation: (id: string, values: Record<string, any>) => api.post(`/hazop/${id}/recommendations`, values).then(unwrap<any>),
  createAction: (id: string, recommendationId: string) => api.post(`/hazop/${id}/recommendations/${recommendationId}/create-action`).then(unwrap<any>),
  addTeamMember: (id: string, values: Record<string, any>) => api.post(`/hazop/${id}/team`, values).then(unwrap<any>),
  addLinkedRecord: (id: string, values: Record<string, any>) => api.post(`/hazop/${id}/linked-records`, values).then(unwrap<any>),
  uploadAttachment: (id: string, input: { file?: File; category?: string; description?: string; title?: string }) => {
    const form = new FormData();
    if (input.file) form.append('file', input.file);
    if (input.category) form.append('category', input.category);
    if (input.description) form.append('description', input.description);
    if (input.title) form.append('title', input.title);
    return api.post(`/hazop/${id}/attachments`, form).then(unwrap<any>);
  }
};
