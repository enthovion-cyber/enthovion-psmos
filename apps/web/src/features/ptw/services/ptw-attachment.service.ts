import { api } from '@/services/api';
import type { AttachmentRequirementValues, AttachmentUploadValues, LinkDocumentValues } from '../schemas/attachment.schema';

function unwrap<T>(response: { data: { data: T } }) { return response.data.data; }

export type PermitAttachment = {
  id: string;
  title: string;
  attachment_type?: string | null;
  file_name: string;
  mime_type: string;
  size_bytes?: number;
  file_size?: number;
  storage_key?: string;
  file_key?: string;
  description?: string | null;
  related_section?: string | null;
  is_evidence?: boolean;
  is_required?: boolean;
  visibility?: string | null;
  document_id?: string | null;
  document_version_id?: string | null;
  uploaded_by?: string | null;
  uploaded_at?: string | null;
  created_at?: string | null;
};
export type AttachmentSummary = { totalAttachments: number; requiredAttachments: number; missingRequired: number; uploadedToday: number; linkedDocuments: number; storageUsedBytes: number; status: string; missingTypes: string[] };
export type AttachmentRequirement = { id: string; permit_type?: string | null; risk_level?: string | null; attachment_type: string; is_required: boolean; description?: string | null; is_active?: boolean };
export type AttachmentPreview = PermitAttachment & { previewUrl: string; previewSupported: boolean };

export const attachmentTypes = ['Job Safety Analysis', 'Method Statement', 'Rescue Plan', 'Excavation Drawing', 'Radiography Plan', 'Electrical Isolation Drawing', 'P&ID', 'SOP', 'LOTO Photo', 'Gas Test Certificate', 'Worksite Photo', 'Closure Photo', 'Fire Watch Record', 'Toolbox Talk Record', 'SIMOPS Plan', 'Control Room Instruction', 'Permit Certificate', 'Isolation Certificate', 'Other'];

export const ptwAttachmentService = {
  list: (permitId: string) => api.get(`/ptw/${permitId}/attachments`).then(unwrap<PermitAttachment[]>),
  summary: (permitId: string) => api.get(`/ptw/${permitId}/attachments/summary`).then(unwrap<AttachmentSummary>),
  requirementsForPermit: (permitId: string) => api.get(`/ptw/${permitId}/attachments/requirements`).then(unwrap<AttachmentRequirement[]>),
  detail: (permitId: string, attachmentId: string) => api.get(`/ptw/${permitId}/attachments/${attachmentId}`).then(unwrap<PermitAttachment>),
  preview: (permitId: string, attachmentId: string) => api.get(`/ptw/${permitId}/attachments/${attachmentId}/preview`).then(unwrap<AttachmentPreview>),
  downloadUrl: (permitId: string, attachmentId: string) => `${api.defaults.baseURL}/ptw/${permitId}/attachments/${attachmentId}/download`,
  previewUrl: (permitId: string, attachmentId: string) => `${api.defaults.baseURL}/ptw/${permitId}/attachments/${attachmentId}/preview`,
  upload: (permitId: string, file: File, input: AttachmentUploadValues) => {
    const form = new FormData();
    form.append('file', file);
    form.append('title', input.title);
    form.append('fileName', file.name);
    form.append('mimeType', file.type || 'application/octet-stream');
    form.append('sizeBytes', String(file.size));
    form.append('attachmentType', input.attachmentType);
    if (input.description) form.append('description', input.description);
    if (input.relatedSection) form.append('relatedSection', input.relatedSection);
    form.append('isEvidence', String(input.isEvidence));
    form.append('isRequired', String(input.isRequired));
    form.append('visibility', input.visibility);
    return api.post(`/ptw/${permitId}/attachments`, form).then(unwrap<PermitAttachment>);
  },
  delete: (permitId: string, attachmentId: string) => api.delete(`/ptw/${permitId}/attachments/${attachmentId}`).then(unwrap<{ deleted: boolean; id: string }>),
  linkDocument: (permitId: string, input: LinkDocumentValues) => api.post(`/ptw/${permitId}/attachments/link-document`, input).then(unwrap<PermitAttachment>),
  unlinkDocument: (permitId: string, documentId: string) => api.delete(`/ptw/${permitId}/attachments/unlink-document/${documentId}`).then(unwrap<PermitAttachment>),
  requirements: () => api.get('/ptw/attachment-requirements').then(unwrap<AttachmentRequirement[]>),
  createRequirement: (input: AttachmentRequirementValues) => api.post('/ptw/attachment-requirements', input).then(unwrap<AttachmentRequirement>),
  updateRequirement: (id: string, input: AttachmentRequirementValues) => api.patch(`/ptw/attachment-requirements/${id}`, input).then(unwrap<AttachmentRequirement>),
  deleteRequirement: (id: string) => api.delete(`/ptw/attachment-requirements/${id}`).then(unwrap<AttachmentRequirement>)
};
