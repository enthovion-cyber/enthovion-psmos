import { api } from '@/services/api';

function unwrap<T>(response: { data: { data: T } }) {
  return response.data.data;
}

export const pssrChecklistService = {
  get: (pssrId: string) => api.get(`/pssr/${pssrId}/checklist`).then(unwrap<any>),
  summary: (pssrId: string) => api.get(`/pssr/${pssrId}/checklist/summary`).then(unwrap<any>),
  generate: (pssrId: string) => api.post(`/pssr/${pssrId}/checklist/generate`).then(unwrap<any>),
  regenerate: (pssrId: string) => api.post(`/pssr/${pssrId}/checklist/regenerate`).then(unwrap<any>),
  addItem: (pssrId: string, values: Record<string, any>) => api.post(`/pssr/${pssrId}/checklist/items`, values).then(unwrap<any>),
  updateItem: (pssrId: string, itemId: string, values: Record<string, any>) => api.patch(`/pssr/${pssrId}/checklist/items/${itemId}`, values).then(unwrap<any>),
  complete: (pssrId: string, itemId: string) => api.post(`/pssr/${pssrId}/checklist/items/${itemId}/complete`, {}).then(unwrap<any>),
  notApplicable: (pssrId: string, itemId: string) => api.post(`/pssr/${pssrId}/checklist/items/${itemId}/not-applicable`, {}).then(unwrap<any>),
  fail: (pssrId: string, itemId: string, reason: string) => api.post(`/pssr/${pssrId}/checklist/items/${itemId}/fail`, { reason }).then(unwrap<any>),
  waive: (pssrId: string, itemId: string, reason: string) => api.post(`/pssr/${pssrId}/checklist/items/${itemId}/waive`, { reason }).then(unwrap<any>),
  evidence: (pssrId: string, itemId: string, values: Record<string, any>) => api.post(`/pssr/${pssrId}/checklist/items/${itemId}/evidence`, values).then(unwrap<any>),
  requestVerification: (pssrId: string, itemId: string) => api.post(`/pssr/${pssrId}/checklist/items/${itemId}/request-verification`, {}).then(unwrap<any>),
  verify: (pssrId: string, itemId: string, comment: string) => api.post(`/pssr/${pssrId}/checklist/items/${itemId}/verify`, { comment }).then(unwrap<any>),
  rejectVerification: (pssrId: string, itemId: string, reason: string) => api.post(`/pssr/${pssrId}/checklist/items/${itemId}/reject-verification`, { reason }).then(unwrap<any>),
  blockers: (pssrId: string) => api.get(`/pssr/${pssrId}/checklist/blockers`).then(unwrap<any[]>),
  history: (pssrId: string) => api.get(`/pssr/${pssrId}/checklist/history`).then(unwrap<any[]>)
};
