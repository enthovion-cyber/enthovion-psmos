import { api } from '@/services/api';

function unwrap<T>(response: { data: { data: T } }) {
  return response.data.data;
}

export const mocHistoryService = {
  list: (id: string, params?: Record<string, any>) => api.get(`/moc/${id}/history`, { params }).then(unwrap<any[]>),
  summary: (id: string) => api.get(`/moc/${id}/history/summary`).then(unwrap<any>),
  get: (id: string, eventId: string) => api.get(`/moc/${id}/history/${eventId}`).then(unwrap<any>),
  exportCsv: (id: string) => api.get(`/moc/${id}/history/export/csv`).then(unwrap<any>),
  exportPdf: (id: string) => api.get(`/moc/${id}/history/export/pdf`).then(unwrap<any>)
};
