import { api } from '@/services/api';
import type { IncidentCreateContext, IncidentCreateValues, IncidentSubmitResult } from '../types/incident-create.types';

const unwrap = <T,>(response: { data: { data: T } }) => response.data.data;

export const incidentCreateService = {
  context: () => api.get('/incidents/new/context').then(unwrap<IncidentCreateContext>),
  siteContext: (params: Record<string, any>) => api.get('/incidents/new/site-context', { params }).then(unwrap<any>),
  riskMatrix: () => api.get('/incidents/new/risk-matrix').then(unwrap<any>),
  classificationConfig: () => api.get('/incidents/new/classification-config').then(unwrap<any>),
  pseThresholdConfig: () => api.get('/incidents/new/pse-threshold-config').then(unwrap<any>),
  createDraft: (values: { data: IncidentCreateValues; currentStep: number; siteId?: string; companyId?: string }) => api.post('/incidents/drafts', values).then(unwrap<any>),
  getDraft: (draftId: string) => api.get(`/incidents/drafts/${draftId}`).then(unwrap<any>),
  updateDraft: (draftId: string, values: { data: IncidentCreateValues; currentStep: number; siteId?: string; companyId?: string }) => api.patch(`/incidents/drafts/${draftId}`, values).then(unwrap<any>),
  deleteDraft: (draftId: string) => api.delete(`/incidents/drafts/${draftId}`).then(unwrap<any>),
  submitDraft: (draftId: string) => api.post(`/incidents/drafts/${draftId}/submit`).then(unwrap<IncidentSubmitResult>),
  validate: (values: IncidentCreateValues & { finalSubmit?: boolean }) => api.post('/incidents/validate', values).then(unwrap<any>),
  submit: (values: IncidentCreateValues) => api.post('/incidents', values).then(unwrap<IncidentSubmitResult>),
  calculateRisk: (values: IncidentCreateValues) => api.post('/incidents/calculate-potential-risk', values).then(unwrap<any>),
  classifyPsmPse: (values: IncidentCreateValues) => api.post('/incidents/classify-psm-pse', values).then(unwrap<any>),
  recommendFollowups: (values: IncidentCreateValues) => api.post('/incidents/recommend-followups', values).then(unwrap<any>),
  lookupEquipment: (search: string) => api.get('/incidents/lookups/equipment', { params: { search } }).then(unwrap<any[]>),
  lookupChemicals: (search: string) => api.get('/incidents/lookups/chemicals', { params: { search } }).then(unwrap<any[]>),
  lookupSds: (search: string) => api.get('/incidents/lookups/sds', { params: { search } }).then(unwrap<any[]>),
  lookupPtw: (search: string) => api.get('/incidents/lookups/ptw', { params: { search } }).then(unwrap<any[]>),
  lookupMoc: (search: string) => api.get('/incidents/lookups/moc', { params: { search } }).then(unwrap<any[]>),
  lookupPssr: (search: string) => api.get('/incidents/lookups/pssr', { params: { search } }).then(unwrap<any[]>),
  lookupUsers: (search: string) => api.get('/incidents/lookups/users', { params: { search } }).then(unwrap<any[]>),
  uploadEvidence: (values: Record<string, any>) => api.post('/incidents/evidence/upload', values).then(unwrap<any>),
  deleteEvidence: (evidenceId: string) => api.delete(`/incidents/evidence/${evidenceId}`).then(unwrap<any>)
};
