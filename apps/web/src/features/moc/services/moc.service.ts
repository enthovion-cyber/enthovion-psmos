import { api } from '@/services/api';
import type { MOCCreateValues } from '../schemas/moc.schema';

function unwrap<T>(response: { data: { data: T } }) {
  return response.data.data;
}

export type MocContext = {
  companies: Array<Record<string, any>>;
  sites: Array<Record<string, any>>;
  units: Array<Record<string, any>>;
  areas: Array<Record<string, any>>;
  departments: Array<Record<string, any>>;
  users: Array<Record<string, any>>;
  siteMaxTemporaryDurationDays: number;
};

export type MocEquipmentSearchItem = {
  id: string;
  tag: string;
  name: string;
  type?: string;
  criticality?: string;
  safetyCritical?: boolean;
  siteId?: string;
  unitId?: string;
  areaId?: string;
  system?: string;
  fluidService?: string;
  linkedPtwCount?: number;
  openActionCount?: number;
  openIncidentCount?: number;
  openHazopRecommendationCount?: number;
};

export const mocService = {
  context: () => api.get('/moc/new/context').then(unwrap<MocContext>),
  equipmentSearch: (search: string) => api.get('/moc/equipment-search', { params: { search } }).then(unwrap<MocEquipmentSearchItem[]>),
  list: (params?: Record<string, any>) => api.get('/moc', { params }).then(unwrap<any[]>),
  create: (values: MOCCreateValues, submit = false) => api.post('/moc', values, { params: { submit } }).then(unwrap<any>),
  get: (id: string) => api.get(`/moc/${id}`).then(unwrap<any>),
  update: (id: string, values: Partial<MOCCreateValues>) => api.patch(`/moc/${id}`, values).then(unwrap<any>),
  summary: (id: string) => api.get(`/moc/${id}/summary`).then(unwrap<any>),
  submit: (id: string) => api.post(`/moc/${id}/submit`).then(unwrap<any>),
  approve: (id: string, comment?: string) => api.post(`/moc/${id}/approve`, { comment }).then(unwrap<any>),
  reject: (id: string, comment?: string) => api.post(`/moc/${id}/reject`, { comment }).then(unwrap<any>),
  returnForRevision: (id: string, comment?: string) => api.post(`/moc/${id}/return`, { comment }).then(unwrap<any>),
  startImplementation: (id: string, comment?: string) => api.post(`/moc/${id}/start-implementation`, { comment }).then(unwrap<any>),
  markImplementationComplete: (id: string, comment?: string) => api.post(`/moc/${id}/mark-implementation-complete`, { comment }).then(unwrap<any>),
  readyForStartup: (id: string, comment?: string) => api.post(`/moc/${id}/ready-for-startup`, { comment }).then(unwrap<any>),
  close: (id: string, comment?: string) => api.post(`/moc/${id}/close`, { comment }).then(unwrap<any>),
  cancel: (id: string, comment?: string) => api.post(`/moc/${id}/cancel`, { comment }).then(unwrap<any>),
  duplicate: (id: string) => api.post(`/moc/${id}/duplicate`).then(unwrap<any>),
  risk: (id: string) => api.get(`/moc/${id}/risk`).then(unwrap<any>),
  updateRisk: (id: string, values: Record<string, any>) => api.patch(`/moc/${id}/risk`, values).then(unwrap<any>),
  impact: (id: string) => api.get(`/moc/${id}/impact-assessment`).then(unwrap<any>),
  updateImpact: (id: string, values: Record<string, any>) => api.patch(`/moc/${id}/impact-assessment`, values).then(unwrap<any>),
  engineeringDocuments: (id: string) => api.get(`/moc/${id}/engineering-documents`).then(unwrap<any[]>),
  linkEngineeringDocument: (id: string, values: Record<string, any>) => api.post(`/moc/${id}/engineering-documents/link-document`, values).then(unwrap<any>),
  requiredActions: (id: string) => api.get(`/moc/${id}/required-actions`).then(unwrap<any[]>),
  generateRequiredActions: (id: string) => api.post(`/moc/${id}/required-actions/generate`).then(unwrap<any[]>),
  addRequiredAction: (id: string, values: Record<string, any>) => api.post(`/moc/${id}/required-actions`, values).then(unwrap<any>),
  updateRequiredAction: (id: string, actionId: string, values: Record<string, any>) => api.patch(`/moc/${id}/required-actions/${actionId}`, values).then(unwrap<any>),
  workflow: (id: string) => api.get(`/moc/${id}/workflow`).then(unwrap<any>),
  temporaryControl: (id: string) => api.get(`/moc/${id}/temporary-control`).then(unwrap<any>),
  updateTemporaryControl: (id: string, values: Record<string, any>) => api.patch(`/moc/${id}/temporary-control`, values).then(unwrap<any>),
  extendTemporaryControl: (id: string, values: Record<string, any>) => api.post(`/moc/${id}/temporary-control/extend`, values).then(unwrap<any>),
  emergencyControl: (id: string) => api.get(`/moc/${id}/emergency-control`).then(unwrap<any>),
  updateEmergencyControl: (id: string, values: Record<string, any>) => api.patch(`/moc/${id}/emergency-control`, values).then(unwrap<any>),
  completeEmergencyReview: (id: string, values: Record<string, any>) => api.post(`/moc/${id}/emergency-control/complete-review`, values).then(unwrap<any>),
  pssr: (id: string) => api.get(`/moc/${id}/pssr`).then(unwrap<any>),
  triggerPssr: (id: string, values: Record<string, any>) => api.post(`/moc/${id}/pssr/trigger`, values).then(unwrap<any>),
  communicationTraining: (id: string) => api.get(`/moc/${id}/communication-training`).then(unwrap<any>),
  addStakeholder: (id: string, values: Record<string, any>) => api.post(`/moc/${id}/stakeholders`, values).then(unwrap<any>),
  addCommunication: (id: string, values: Record<string, any>) => api.post(`/moc/${id}/communication`, values).then(unwrap<any>),
  addTrainingRequirement: (id: string, values: Record<string, any>) => api.post(`/moc/${id}/training-requirements`, values).then(unwrap<any>),
  history: (id: string) => api.get(`/moc/${id}/history`).then(unwrap<any[]>),
  attachments: (id: string) => api.get(`/moc/${id}/attachments`).then(unwrap<any[]>),
  report: (id: string) => api.get(`/moc/${id}/report`).then(unwrap<any>),
  generatedActionsPreview: (values: Partial<MOCCreateValues>) => api.post('/moc/generated-actions-preview', values).then(unwrap<Array<Record<string, any>>>),
  uploadDocument: (mocId: string, input: { file?: File; title: string; documentType: string; justification?: string; documentId?: string }) => {
    const form = new FormData();
    if (input.file) form.append('file', input.file);
    form.append('title', input.title);
    form.append('documentType', input.documentType);
    if (input.justification) form.append('justification', input.justification);
    if (input.documentId) form.append('documentId', input.documentId);
    return api.post(`/moc/${mocId}/documents`, form).then(unwrap<any>);
  },
  deleteDocument: (mocId: string, documentId: string) => api.delete(`/moc/${mocId}/engineering-documents/${documentId}`).then(unwrap<{ deleted: boolean }>),
  uploadAttachment: (mocId: string, input: { file?: File; title: string; attachmentType: string; documentId?: string }) => {
    const form = new FormData();
    if (input.file) form.append('file', input.file);
    form.append('title', input.title);
    form.append('attachmentType', input.attachmentType);
    if (input.documentId) form.append('documentId', input.documentId);
    return api.post(`/moc/${mocId}/attachments`, form).then(unwrap<any>);
  },
  deleteAttachment: (mocId: string, attachmentId: string) => api.delete(`/moc/${mocId}/attachments/${attachmentId}`).then(unwrap<{ deleted: boolean }>)
};
