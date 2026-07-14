import { api } from './api';

export type DocumentRecord = {
  id: string;
  document_number: string;
  title: string;
  description?: string | null;
  document_type: string;
  status: string;
  site_id: string;
  unit_id?: string | null;
  area_id?: string | null;
  owner_id: string;
  current_version_id?: string | null;
  current_version?: DocumentVersion | null;
  versions?: DocumentVersion[];
  relations?: DocumentRelation[];
  comments?: DocumentComment[];
  approvals?: DocumentApproval[];
  access_logs?: DocumentAccessLog[];
  review?: DocumentReview[];
  tags?: Array<{ tag: string }>;
  updated_at: string;
  created_at: string;
};

export type DocumentVersion = { id: string; version_number: string; file_name: string; file_url: string; file_type: string; file_size: number; change_summary?: string | null; is_current: boolean; uploaded_at: string };
export type DocumentRelation = { id: string; related_module: string; related_record_id: string; equipment_id?: string | null; relation_type: string; created_at: string };
export type DocumentComment = { id: string; author_id?: string | null; body: string; created_at: string; edited_at?: string | null };
export type DocumentApproval = { id: string; approver_id?: string | null; decision: string; comment?: string | null; created_at: string };
export type DocumentAccessLog = { id: string; user_id?: string | null; action: string; created_at: string };
export type DocumentReview = { id: string; review_frequency_months: number; last_review_date?: string | null; next_review_date: string; review_status: string; review_owner_id?: string | null };
export type DocumentFolder = { id: string; name: string; path: string; parent_id?: string | null };

export type DocumentUploadInput = {
  title: string;
  description?: string;
  documentType: string;
  siteId: string;
  unitId?: string;
  areaId?: string;
  ownerId: string;
  folderId?: string;
  tags?: string;
  relatedEquipmentId?: string;
  relatedModule?: string;
  relatedRecordId?: string;
  relationType?: string;
  reviewFrequencyMonths?: number;
  changeSummary?: string;
  file: File;
};

function data<T>(response: { data: T }) { return response.data; }

function form(input: Partial<DocumentUploadInput>) {
  const fd = new FormData();
  Object.entries(input).forEach(([key, value]) => {
    if (value !== undefined && value !== null) fd.append(key, value instanceof File ? value : String(value));
  });
  return fd;
}

export const documentsService = {
  list: (params?: Record<string, string>) => api.get<DocumentRecord[]>('/documents', { params }).then(data),
  get: (id: string) => api.get<DocumentRecord>(`/documents/${id}`).then(data),
  folders: () => api.get<DocumentFolder[]>('/documents/folders').then(data),
  reviewDue: () => api.get<DocumentReview[]>('/documents/review-due').then(data),
  overdueReviews: () => api.get<DocumentReview[]>('/documents/overdue-reviews').then(data),
  upload: (input: DocumentUploadInput) => api.post<DocumentRecord>('/documents', form(input)).then(data),
  update: (id: string, input: Partial<DocumentUploadInput>) => api.patch<DocumentRecord>(`/documents/${id}`, input).then(data),
  uploadVersion: (id: string, input: { file: File; changeSummary: string }) => api.post<DocumentRecord>(`/documents/${id}/versions`, form(input)).then(data),
  submitReview: (id: string) => api.post<DocumentRecord>(`/documents/${id}/submit-review`).then(data),
  approve: (id: string, comment?: string) => api.post<DocumentRecord>(`/documents/${id}/approve`, { comment }).then(data),
  reject: (id: string, comment: string) => api.post<DocumentRecord>(`/documents/${id}/reject`, { comment }).then(data),
  activate: (id: string) => api.post<DocumentRecord>(`/documents/${id}/activate`).then(data),
  obsolete: (id: string, reason: string, replacementDocumentId?: string) => api.post<DocumentRecord>(`/documents/${id}/obsolete`, { reason, replacementDocumentId }).then(data),
  archive: (id: string, reason: string) => api.post<DocumentRecord>(`/documents/${id}/archive`, { reason }).then(data),
  addRelation: (id: string, input: { relatedModule: string; relatedRecordId: string; equipmentId?: string; relationType?: string }) => api.post<DocumentRelation>(`/documents/${id}/relations`, input).then(data),
  deleteRelation: (id: string, relationId: string) => api.delete<{ deleted: boolean }>(`/documents/${id}/relations/${relationId}`).then(data),
  addComment: (id: string, body: string) => api.post<DocumentComment>(`/documents/${id}/comments`, { body }).then(data),
  updateComment: (commentId: string, body: string) => api.patch<DocumentComment>(`/documents/comments/${commentId}`, { body }).then(data),
  deleteComment: (commentId: string) => api.delete<{ deleted: boolean }>(`/documents/comments/${commentId}`).then(data),
  accessLog: (id: string) => api.get<DocumentAccessLog[]>(`/documents/${id}/access-log`).then(data),
  previewUrl: (id: string) => `${api.defaults.baseURL}/documents/${id}/preview`,
  downloadUrl: (id: string) => `${api.defaults.baseURL}/documents/${id}/download`
};
