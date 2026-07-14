import { api } from '@/services/api';

function unwrap<T>(response: { data: { data: T } }) {
  return response.data.data;
}

export const mocAttachmentsService = {
  list: (id: string) => api.get(`/moc/${id}/attachments`).then(unwrap<any[]>),
  summary: (id: string) => api.get(`/moc/${id}/attachments/summary`).then(unwrap<any>),
  get: (id: string, attachmentId: string) => api.get(`/moc/${id}/attachments/${attachmentId}`).then(unwrap<any>),
  preview: (id: string, attachmentId: string) => api.get(`/moc/${id}/attachments/${attachmentId}/preview`).then(unwrap<any>),
  download: (id: string, attachmentId: string) => api.get(`/moc/${id}/attachments/${attachmentId}/download`).then(unwrap<any>),
  upload: (id: string, input: Record<string, any> & { file?: File }) => {
    const form = new FormData();
    Object.entries(input).forEach(([key, value]) => {
      if (value !== undefined && value !== null) form.append(key, value as any);
    });
    return api.post(`/moc/${id}/attachments`, form).then(unwrap<any>);
  },
  delete: (id: string, attachmentId: string) => api.delete(`/moc/${id}/attachments/${attachmentId}`).then(unwrap<any>),
  linkDocument: (id: string, values: Record<string, any>) => api.post(`/moc/${id}/attachments/link-document`, values).then(unwrap<any>),
  unlinkDocument: (id: string, documentId: string) => api.delete(`/moc/${id}/attachments/unlink-document/${documentId}`).then(unwrap<any[]>)
};
