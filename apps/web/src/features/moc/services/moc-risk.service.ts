import { api } from '@/services/api';
import type { MOCRiskValues } from '../schemas/moc-risk.schema';

function unwrap<T>(response: { data: { data: T } }) {
  return response.data.data;
}

export const mocRiskService = {
  detail: (id: string) => api.get(`/moc/${id}/risk`).then(unwrap<any>),
  save: (id: string, values: MOCRiskValues) => api.patch(`/moc/${id}/risk`, values).then(unwrap<any>),
  recalculate: (id: string, values: Partial<MOCRiskValues>) => api.post(`/moc/${id}/risk/recalculate`, values).then(unwrap<any>),
  complete: (id: string) => api.post(`/moc/${id}/risk/complete`).then(unwrap<any>),
  requestReassessment: (id: string, reason: string) => api.post(`/moc/${id}/risk/request-reassessment`, { reason }).then(unwrap<any>),
  lock: (id: string) => api.post(`/moc/${id}/risk/lock`).then(unwrap<any>),
  unlock: (id: string) => api.post(`/moc/${id}/risk/unlock`).then(unwrap<any>),
  history: (id: string) => api.get(`/moc/${id}/risk/history`).then(unwrap<any[]>),
  reviewRequirements: (id: string) => api.get(`/moc/${id}/risk/review-requirements`).then(unwrap<any[]>),
  applyReviewRequirements: (id: string) => api.post(`/moc/${id}/risk/apply-review-requirements`).then(unwrap<any[]>),
  dashboard: () => api.get('/moc/risk-dashboard').then(unwrap<any>),
  summary: () => api.get('/moc/risk-summary').then(unwrap<any>)
};
