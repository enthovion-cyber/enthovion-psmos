import { api } from '@/services/api';
import type { MOCImpactValues } from '../schemas/moc-impact.schema';

function unwrap<T>(response: { data: { data: T } }) {
  return response.data.data;
}

export const mocImpactService = {
  assessment: (id: string) => api.get(`/moc/${id}/impact-assessment`).then(unwrap<any>),
  answers: (id: string) => api.get(`/moc/${id}/impact-assessment/answers`).then(unwrap<any[]>),
  saveAnswers: (id: string, values: MOCImpactValues) => api.patch(`/moc/${id}/impact-assessment/answers`, values).then(unwrap<any>),
  complete: (id: string) => api.post(`/moc/${id}/impact-assessment/complete`).then(unwrap<any>),
  regenerateActions: (id: string) => api.post(`/moc/${id}/impact-assessment/regenerate-actions`).then(unwrap<any[]>),
  generatedActions: (id: string) => api.get(`/moc/${id}/impact-assessment/generated-actions`).then(unwrap<any[]>),
  applyGeneratedActions: (id: string) => api.post(`/moc/${id}/impact-assessment/apply-generated-actions`).then(unwrap<any[]>),
  startupBlockers: (id: string) => api.get(`/moc/${id}/startup-blockers`).then(unwrap<any[]>),
  closureBlockers: (id: string) => api.get(`/moc/${id}/closure-blockers`).then(unwrap<any[]>),
  rules: () => api.get('/moc/impact-action-rules').then(unwrap<any[]>)
};
