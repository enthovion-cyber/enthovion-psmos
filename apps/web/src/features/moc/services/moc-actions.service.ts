import { api } from '@/services/api';
import type { MOCActionValues } from '../schemas/moc-actions.schema';

function unwrap<T>(response: { data: { data: T } }) {
  return response.data.data;
}

export const mocActionsService = {
  list: (id: string) => api.get(`/moc/${id}/required-actions`).then(unwrap<any[]>),
  summary: (id: string) => api.get(`/moc/${id}/required-actions/summary`).then(unwrap<any>),
  generate: (id: string) => api.post(`/moc/${id}/required-actions/generate`).then(unwrap<any>),
  sync: (id: string, source = 'all') => api.post(`/moc/${id}/required-actions/sync`, { source }).then(unwrap<any>),
  createCustom: (id: string, values: MOCActionValues) => api.post(`/moc/${id}/required-actions/custom`, values).then(unwrap<any>),
  update: (id: string, actionId: string, values: Record<string, any>) => api.patch(`/moc/${id}/required-actions/${actionId}`, values).then(unwrap<any>),
  noLongerRequired: (id: string, actionId: string, reason: string) => api.post(`/moc/${id}/required-actions/${actionId}/no-longer-required`, { reason }).then(unwrap<any>),
  createUniversalActions: (id: string) => api.post(`/moc/${id}/required-actions/create-universal-actions`).then(unwrap<any[]>),
  startupBlockers: (id: string) => api.get(`/moc/${id}/startup-blockers`).then(unwrap<any[]>),
  closureBlockers: (id: string) => api.get(`/moc/${id}/closure-blockers`).then(unwrap<any[]>),
  closureChecklist: (id: string) => api.get(`/moc/${id}/closure-checklist`).then(unwrap<any[]>),
  recalculateChecklist: (id: string) => api.post(`/moc/${id}/closure-checklist/recalculate`).then(unwrap<any[]>),
  links: (id: string) => api.get(`/moc/${id}/action-links`).then(unwrap<any[]>)
};
