import { api } from '@/services/api';
import type { EngineeringDocumentValues, EngineeringReviewValues } from '../schemas/moc-engineering.schema';

function unwrap<T>(response: { data: { data: T } }) {
  return response.data.data;
}

export const mocEngineeringService = {
  package: (id: string) => api.get(`/moc/${id}/engineering-package`).then(unwrap<any>),
  summary: (id: string) => api.get(`/moc/${id}/engineering-package/summary`).then(unwrap<any>),
  requirements: (id: string) => api.get(`/moc/${id}/engineering-package/requirements`).then(unwrap<any[]>),
  regenerateRequirements: (id: string) => api.post(`/moc/${id}/engineering-package/regenerate-requirements`).then(unwrap<any[]>),
  documents: (id: string) => api.get(`/moc/${id}/engineering-documents`).then(unwrap<any[]>),
  uploadDocument: (id: string, values: EngineeringDocumentValues & { file?: File }) => {
    const form = new FormData();
    if (values.file) form.append('file', values.file);
    for (const [key, value] of Object.entries(values)) {
      if (key !== 'file' && value !== undefined) form.append(key, String(value));
    }
    return api.post(`/moc/${id}/engineering-documents`, form).then(unwrap<any>);
  },
  linkDocument: (id: string, values: EngineeringDocumentValues) => api.post(`/moc/${id}/engineering-documents/link-document-control`, values).then(unwrap<any>),
  getDocument: (id: string, documentId: string) => api.get(`/moc/${id}/engineering-documents/${documentId}`).then(unwrap<any>),
  previewDocument: (id: string, documentId: string) => api.get(`/moc/${id}/engineering-documents/${documentId}/preview`).then(unwrap<any>),
  downloadDocument: (id: string, documentId: string) => api.get(`/moc/${id}/engineering-documents/${documentId}/download`).then(unwrap<any>),
  deleteDocument: (id: string, documentId: string) => api.delete(`/moc/${id}/engineering-documents/${documentId}`).then(unwrap<any>),
  unlinkDocument: (id: string, documentId: string) => api.delete(`/moc/${id}/engineering-documents/unlink-document-control/${documentId}`).then(unwrap<any>),
  submitReview: (id: string) => api.post(`/moc/${id}/engineering-package/submit-review`).then(unwrap<any>),
  approve: (id: string, values: EngineeringReviewValues) => api.post(`/moc/${id}/engineering-package/approve`, values).then(unwrap<any>),
  reject: (id: string, values: EngineeringReviewValues) => api.post(`/moc/${id}/engineering-package/reject`, values).then(unwrap<any>),
  requestDocument: (id: string, values: EngineeringReviewValues) => api.post(`/moc/${id}/engineering-package/request-document`, values).then(unwrap<any>)
};
