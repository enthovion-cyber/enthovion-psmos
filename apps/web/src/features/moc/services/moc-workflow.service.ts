import { api } from '@/services/api';

function unwrap<T>(response: { data: { data: T } }) {
  return response.data.data;
}

export const mocWorkflowService = {
  get: (id: string) => api.get(`/moc/${id}/workflow`).then(unwrap<any>),
  start: (id: string) => api.post(`/moc/${id}/workflow/start`).then(unwrap<any>),
  approve: (id: string, values: Record<string, any>) => api.post(`/moc/${id}/workflow/approve`, values).then(unwrap<any>),
  reject: (id: string, values: Record<string, any>) => api.post(`/moc/${id}/workflow/reject`, values).then(unwrap<any>),
  returnForRevision: (id: string, values: Record<string, any>) => api.post(`/moc/${id}/workflow/return`, values).then(unwrap<any>),
  delegate: (id: string, values: Record<string, any>) => api.post(`/moc/${id}/workflow/delegate`, values).then(unwrap<any>),
  escalate: (id: string) => api.post(`/moc/${id}/workflow/escalate`).then(unwrap<any>),
  restart: (id: string, values: Record<string, any>) => api.post(`/moc/${id}/workflow/restart`, values).then(unwrap<any>),
  history: (id: string) => api.get(`/moc/${id}/workflow/history`).then(unwrap<any[]>),
  blockers: (id: string) => api.get(`/moc/${id}/workflow/blockers`).then(unwrap<any[]>)
};
