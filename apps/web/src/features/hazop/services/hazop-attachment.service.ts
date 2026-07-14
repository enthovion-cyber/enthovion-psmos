import { api } from '@/services/api';
import type { HazopAttachmentFilters } from '../types/hazop-attachment.types';

function unwrap<T>(response: { data: { data: T } }) {
  return response.data.data;
}

function form(input: Record<string, any>) {
  const formData = new FormData();
  Object.entries(input).forEach(([key, value]) => {
    if (value !== undefined && value !== null) formData.append(key, value instanceof File ? value : String(value));
  });
  return formData;
}

export const hazopAttachmentService = {
  summary: (studyId: string) => api.get(`/hazop/${studyId}/attachments/summary`).then(unwrap<any>),
  list: (studyId: string, params?: HazopAttachmentFilters) => api.get(`/hazop/${studyId}/attachments`, { params }).then(unwrap<any[]>),
  detail: (studyId: string, attachmentId: string) => api.get(`/hazop/${studyId}/attachments/${attachmentId}`).then(unwrap<any>),
  preview: (studyId: string, attachmentId: string) => api.get(`/hazop/${studyId}/attachments/${attachmentId}/preview`).then(unwrap<any>),
  download: (studyId: string, attachmentId: string) => api.get(`/hazop/${studyId}/attachments/${attachmentId}/download`).then(unwrap<any>),
  upload: (studyId: string, input: Record<string, any>) => api.post(`/hazop/${studyId}/attachments`, form(input)).then(unwrap<any>),
  update: (studyId: string, attachmentId: string, values: Record<string, any>) => api.patch(`/hazop/${studyId}/attachments/${attachmentId}`, values).then(unwrap<any>),
  replace: (studyId: string, attachmentId: string, input: Record<string, any>) => api.post(`/hazop/${studyId}/attachments/${attachmentId}/replace`, form(input)).then(unwrap<any>),
  archive: (studyId: string, attachmentId: string, values: Record<string, any>) => api.post(`/hazop/${studyId}/attachments/${attachmentId}/archive`, values).then(unwrap<any>),
  delete: (studyId: string, attachmentId: string, values: Record<string, any>) => api.delete(`/hazop/${studyId}/attachments/${attachmentId}`, { data: values }).then(unwrap<any>),
  versions: (studyId: string, attachmentId: string) => api.get(`/hazop/${studyId}/attachments/${attachmentId}/versions`).then(unwrap<any[]>),
  accessLogs: (studyId: string, attachmentId: string) => api.get(`/hazop/${studyId}/attachments/${attachmentId}/access-logs`).then(unwrap<any[]>),
  export: (studyId: string) => api.post(`/hazop/${studyId}/attachments/export`).then(unwrap<any>)
};
