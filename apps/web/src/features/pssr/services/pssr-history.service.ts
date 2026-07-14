import { api } from '@/services/api';

function unwrap<T>(response: { data: { data: T } }) {
  return response.data.data;
}

export const pssrHistoryService = {
  get: (pssrId: string, params?: Record<string, any>) => api.get(`/pssr/${pssrId}/history`, { params }).then(unwrap<any>),
  summary: (pssrId: string) => api.get(`/pssr/${pssrId}/history/summary`).then(unwrap<any>),
  event: (pssrId: string, eventId: string) => api.get(`/pssr/${pssrId}/history/${eventId}`).then(unwrap<any>),
  exportCsv: (pssrId: string, params?: Record<string, any>) => api.get(`/pssr/${pssrId}/history/export/csv`, { params }).then(unwrap<any>),
  exportPdf: (pssrId: string, params?: Record<string, any>) => api.get(`/pssr/${pssrId}/history/export/pdf`, { params }).then(unwrap<any>)
};
