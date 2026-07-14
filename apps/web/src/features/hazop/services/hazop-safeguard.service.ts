import { api } from '@/services/api';
import { hazopSafeguardGapSchema, hazopSafeguardSchema, hazopSafeguardTestStatusSchema } from '../schemas/hazop-safeguard.schema';

function unwrap<T>(response: { data: { data: T } }) {
  return response.data.data;
}

function cleanParams(params?: Record<string, any>) {
  return Object.fromEntries(Object.entries(params ?? {}).filter(([, value]) => value !== undefined && value !== '' && value !== 'All'));
}

export const hazopSafeguardService = {
  context: (studyId: string) => api.get(`/hazop/${studyId}/safeguards/context`).then(unwrap<any>),
  summary: (studyId: string) => api.get(`/hazop/${studyId}/safeguards/summary`).then(unwrap<any>),
  register: (studyId: string, params?: Record<string, any>) => api.get(`/hazop/${studyId}/safeguards/register`, { params: cleanParams(params) }).then(unwrap<any>),
  iplCandidates: (studyId: string) => api.get(`/hazop/${studyId}/safeguards/ipl-candidates`).then(unwrap<any[]>),
  gaps: (studyId: string) => api.get(`/hazop/${studyId}/safeguards/gaps`).then(unwrap<any[]>),
  proofTests: (studyId: string) => api.get(`/hazop/${studyId}/safeguards/proof-test-status`).then(unwrap<any[]>),
  detail: (studyId: string, safeguardId: string) => api.get(`/hazop/${studyId}/safeguards/${safeguardId}`).then(unwrap<any>),
  add: (studyId: string, scenarioId: string, values: Record<string, any>) => api.post(`/hazop/${studyId}/scenarios/${scenarioId}/safeguards`, hazopSafeguardSchema.omit({ scenarioId: true }).parse(values)).then(unwrap<any>),
  update: (studyId: string, safeguardId: string, values: Record<string, any>) => api.patch(`/hazop/${studyId}/safeguards/${safeguardId}`, hazopSafeguardSchema.partial().parse(values)).then(unwrap<any>),
  delete: (studyId: string, safeguardId: string) => api.delete(`/hazop/${studyId}/safeguards/${safeguardId}`).then(unwrap<any>),
  markIpl: (studyId: string, safeguardId: string) => api.post(`/hazop/${studyId}/safeguards/${safeguardId}/mark-ipl-candidate`).then(unwrap<any>),
  markCredited: (studyId: string, safeguardId: string) => api.post(`/hazop/${studyId}/safeguards/${safeguardId}/mark-credited`).then(unwrap<any>),
  markNotCredited: (studyId: string, safeguardId: string) => api.post(`/hazop/${studyId}/safeguards/${safeguardId}/mark-not-credited`).then(unwrap<any>),
  linkEquipment: (studyId: string, safeguardId: string, values: Record<string, any>) => api.post(`/hazop/${studyId}/safeguards/${safeguardId}/equipment-links`, values).then(unwrap<any>),
  linkDocument: (studyId: string, safeguardId: string, values: Record<string, any>) => api.post(`/hazop/${studyId}/safeguards/${safeguardId}/document-links`, values).then(unwrap<any>),
  updateTestStatus: (studyId: string, safeguardId: string, values: Record<string, any>) => api.patch(`/hazop/${studyId}/safeguards/${safeguardId}/test-status`, hazopSafeguardTestStatusSchema.parse(values)).then(unwrap<any>),
  createGap: (studyId: string, safeguardId: string, values: Record<string, any>) => api.post(`/hazop/${studyId}/safeguards/${safeguardId}/gaps`, hazopSafeguardGapSchema.parse(values)).then(unwrap<any>),
  createGapAction: (studyId: string, gapId: string, values: Record<string, any>) => api.post(`/hazop/${studyId}/safeguard-gaps/${gapId}/create-action`, values).then(unwrap<any>),
  linkGapAction: (studyId: string, gapId: string, values: Record<string, any>) => api.post(`/hazop/${studyId}/safeguard-gaps/${gapId}/link-action`, values).then(unwrap<any>),
  closeGap: (studyId: string, gapId: string) => api.post(`/hazop/${studyId}/safeguard-gaps/${gapId}/close`).then(unwrap<any>),
  export: (studyId: string) => api.post(`/hazop/${studyId}/safeguards/export`).then(unwrap<any>)
};
