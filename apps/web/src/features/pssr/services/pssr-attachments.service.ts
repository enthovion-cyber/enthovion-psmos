import { api } from '@/services/api';

function unwrap<T>(response: { data: { data: T } }) {
  return response.data.data;
}

export const pssrAttachmentsService = {
  get: (pssrId: string) => api.get(`/pssr/${pssrId}/attachments`).then(unwrap<any>),
  summary: (pssrId: string) => api.get(`/pssr/${pssrId}/attachments/summary`).then(unwrap<any>),
  upload: (pssrId: string, values: Record<string, any>) => api.post(`/pssr/${pssrId}/attachments`, values).then(unwrap<any>),
  attachment: (pssrId: string, attachmentId: string) => api.get(`/pssr/${pssrId}/attachments/${attachmentId}`).then(unwrap<any>),
  delete: (pssrId: string, attachmentId: string) => api.delete(`/pssr/${pssrId}/attachments/${attachmentId}`).then(unwrap<any>),
  download: (pssrId: string, attachmentId: string) => api.get(`/pssr/${pssrId}/attachments/${attachmentId}/download`).then(unwrap<any>),
  preview: (pssrId: string, attachmentId: string) => api.get(`/pssr/${pssrId}/attachments/${attachmentId}/preview`).then(unwrap<any>),
  linkDocument: (pssrId: string, values: Record<string, any>) => api.post(`/pssr/${pssrId}/attachments/link-document`, values).then(unwrap<any>),
  unlinkDocument: (pssrId: string, documentId: string) => api.delete(`/pssr/${pssrId}/attachments/unlink-document/${documentId}`).then(unwrap<any>)
};
