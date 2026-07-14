import { api } from '@/services/api';

function unwrap<T>(response: { data: { data: T } }) {
  return response.data.data;
}

export const pssrPunchListService = {
  get: (pssrId: string) => api.get(`/pssr/${pssrId}/punch-list`).then(unwrap<any>),
  summary: (pssrId: string) => api.get(`/pssr/${pssrId}/punch-list/summary`).then(unwrap<any>),
  sync: (pssrId: string) => api.post(`/pssr/${pssrId}/punch-list/sync`).then(unwrap<any>),
  addItem: (pssrId: string, values: Record<string, any>) => api.post(`/pssr/${pssrId}/punch-list/items`, values).then(unwrap<any>),
  updateItem: (pssrId: string, punchItemId: string, values: Record<string, any>) => api.patch(`/pssr/${pssrId}/punch-list/items/${punchItemId}`, values).then(unwrap<any>),
  evidence: (pssrId: string, punchItemId: string, values: Record<string, any>) => api.post(`/pssr/${pssrId}/punch-list/items/${punchItemId}/evidence`, values).then(unwrap<any>),
  requestVerification: (pssrId: string, punchItemId: string) => api.post(`/pssr/${pssrId}/punch-list/items/${punchItemId}/request-verification`, {}).then(unwrap<any>),
  verify: (pssrId: string, punchItemId: string, comment?: string) => api.post(`/pssr/${pssrId}/punch-list/items/${punchItemId}/verify`, { comment }).then(unwrap<any>),
  reject: (pssrId: string, punchItemId: string, reason: string) => api.post(`/pssr/${pssrId}/punch-list/items/${punchItemId}/reject`, { reason }).then(unwrap<any>),
  defer: (pssrId: string, punchItemId: string, values: Record<string, any>) => api.post(`/pssr/${pssrId}/punch-list/items/${punchItemId}/defer`, values).then(unwrap<any>),
  close: (pssrId: string, punchItemId: string) => api.post(`/pssr/${pssrId}/punch-list/items/${punchItemId}/close`, {}).then(unwrap<any>),
  reopen: (pssrId: string, punchItemId: string) => api.post(`/pssr/${pssrId}/punch-list/items/${punchItemId}/reopen`, {}).then(unwrap<any>),
  startupBlockers: (pssrId: string) => api.get(`/pssr/${pssrId}/punch-list/startup-blockers`).then(unwrap<any[]>),
  actionLinks: (pssrId: string) => api.get(`/pssr/${pssrId}/punch-list/action-links`).then(unwrap<any[]>),
  refreshActionStatuses: (pssrId: string) => api.post(`/pssr/${pssrId}/punch-list/refresh-action-statuses`).then(unwrap<any>)
};
