import { api } from '@/services/api';
import type { LopaAttachmentCommentInput, LopaAttachmentData, LopaAttachmentDetail, LopaAttachmentFilters, LopaAttachmentInput, LopaEvidenceMappingInput } from '../types/lopa-attachment.types';
const unwrap = <T,>(r: { data: { data: T } }) => r.data.data;
const formValue = (form: FormData, key: string, value: unknown) => { if (value === undefined || value === null) return; form.append(key, Array.isArray(value) ? JSON.stringify(value) : String(value)); };
export const lopaAttachmentsService = {
  get: (id: string, filters: LopaAttachmentFilters = {}) => api.get(`/lopa/${id}/attachments`, { params: filters }).then(unwrap<LopaAttachmentData>),
  context: (id: string) => api.get(`/lopa/${id}/attachments/context`).then(unwrap<any>),
  detail: (id: string, attachmentId: string) => api.get(`/lopa/${id}/attachments/${attachmentId}`).then(unwrap<LopaAttachmentDetail>),
  upload: (id: string, file: File, values: LopaAttachmentInput) => { const form = new FormData(); form.append('file', file); Object.entries(values).forEach(([key, value]) => formValue(form, key, value)); return api.post(`/lopa/${id}/attachments/upload`, form).then(unwrap<any>); },
  bulkUpload: (id: string, files: File[], values: LopaAttachmentInput) => { const form = new FormData(); files.forEach(file => form.append('files', file)); Object.entries(values).forEach(([key, value]) => formValue(form, key, value)); return api.post(`/lopa/${id}/attachments/bulk-upload`, form).then(unwrap<any>); },
  update: (id: string, attachmentId: string, values: LopaAttachmentInput) => api.patch(`/lopa/${id}/attachments/${attachmentId}`, values).then(unwrap<any>),
  replace: (id: string, attachmentId: string, file: File, values: LopaAttachmentInput) => { const form = new FormData(); form.append('file', file); Object.entries(values).forEach(([key, value]) => formValue(form, key, value)); return api.post(`/lopa/${id}/attachments/${attachmentId}/replace`, form).then(unwrap<any>); },
  archive: (id: string, attachmentId: string, reason?: string) => api.post(`/lopa/${id}/attachments/${attachmentId}/archive`, { reason }).then(unwrap<any>),
  restore: (id: string, attachmentId: string, reason?: string) => api.post(`/lopa/${id}/attachments/${attachmentId}/restore`, { reason }).then(unwrap<any>),
  remove: (id: string, attachmentId: string, reason?: string) => api.delete(`/lopa/${id}/attachments/${attachmentId}`, { data: { reason } }).then(unwrap<any>),
  versions: (id: string, attachmentId: string) => api.get(`/lopa/${id}/attachments/${attachmentId}/versions`).then(unwrap<any[]>),
  history: (id: string, attachmentId: string) => api.get(`/lopa/${id}/attachments/${attachmentId}/history`).then(unwrap<any[]>),
  documentSearch: (id: string, q: string) => api.get(`/lopa/${id}/attachments/document-search`, { params: { q } }).then(unwrap<any[]>),
  linkDocument: (id: string, values: any) => api.post(`/lopa/${id}/attachments/link-document`, values).then(unwrap<any>),
  unlinkDocument: (id: string, linkId: string, reason?: string) => api.delete(`/lopa/${id}/attachments/document-links/${linkId}`, { data: { reason } }).then(unwrap<any>),
  refreshDocument: (id: string, linkId: string) => api.post(`/lopa/${id}/attachments/document-links/${linkId}/refresh-status`).then(unwrap<any>),
  mappings: (id: string) => api.get(`/lopa/${id}/attachments/evidence-mappings`).then(unwrap<any[]>),
  addMapping: (id: string, values: LopaEvidenceMappingInput) => api.post(`/lopa/${id}/attachments/evidence-mappings`, values).then(unwrap<any>),
  updateMapping: (id: string, mappingId: string, values: LopaEvidenceMappingInput) => api.patch(`/lopa/${id}/attachments/evidence-mappings/${mappingId}`, values).then(unwrap<any>),
  removeMapping: (id: string, mappingId: string, reason?: string) => api.delete(`/lopa/${id}/attachments/evidence-mappings/${mappingId}`, { data: { reason } }).then(unwrap<any>),
  comments: (id: string, attachmentId: string) => api.get(`/lopa/${id}/attachments/${attachmentId}/comments`).then(unwrap<any[]>),
  addComment: (id: string, attachmentId: string, values: LopaAttachmentCommentInput) => api.post(`/lopa/${id}/attachments/${attachmentId}/comments`, values).then(unwrap<any>),
  updateComment: (id: string, attachmentId: string, commentId: string, values: LopaAttachmentCommentInput) => api.patch(`/lopa/${id}/attachments/${attachmentId}/comments/${commentId}`, values).then(unwrap<any>),
  removeComment: (id: string, attachmentId: string, commentId: string, reason?: string) => api.delete(`/lopa/${id}/attachments/${attachmentId}/comments/${commentId}`, { data: { reason } }).then(unwrap<any>),
  bulkUpdate: (id: string, values: any) => api.post(`/lopa/${id}/attachments/bulk-update`, values).then(unwrap<any>),
  bulkDownload: (id: string, attachmentIds: string[]) => api.post(`/lopa/${id}/attachments/bulk-download`, { attachmentIds }).then(unwrap<any>),
  exportIndex: (id: string, filters: LopaAttachmentFilters) => api.get(`/lopa/${id}/attachments/export-index`, { params: filters }).then(unwrap<any>)
};
