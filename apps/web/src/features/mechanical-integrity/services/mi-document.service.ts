import { get, post, remove } from './safeguard-api';
import type { MiDocumentLink, MiDocumentsResponse } from '../types/mi-document.types';

const base = '/mechanical-integrity/documents';

export const miDocumentService = {
  list: (params: Record<string, unknown> = {}) => get<MiDocumentsResponse>(base, params),
  missing: (params: Record<string, unknown> = {}) => get<Array<Record<string, unknown>>>(`${base}/missing`, params),
  expired: (params: Record<string, unknown> = {}) => get<MiDocumentLink[]>(`${base}/expired`, params),
  pendingApproval: (params: Record<string, unknown> = {}) => get<MiDocumentLink[]>(`${base}/pending-approval`, params),
  get: (id: string) => get<{ row: MiDocumentLink; history: Array<Record<string, unknown>> }>(`${base}/${id}`),
  link: (input: Record<string, unknown>) => post<MiDocumentLink>(`${base}/link`, input),
  remove: (id: string, reason?: string) => remove<MiDocumentLink>(`${base}/${id}?reason=${encodeURIComponent(reason ?? '')}`),
  equipment: (equipmentId: string, params: Record<string, unknown> = {}) => get<MiDocumentsResponse>(`/mechanical-integrity/equipment/${equipmentId}/documents`, params),
  search: (params: Record<string, unknown> = {}) => get<Array<Record<string, unknown>>>(`${base}/search`, params),
  evaluate: (input: Record<string, unknown>) => post<Record<string, unknown>>(`${base}/evaluate-requirements`, input),
  lookups: () => Promise.all([
    get<string[]>('/mechanical-integrity/lookups/document-types'),
    get<string[]>('/mechanical-integrity/lookups/document-link-statuses'),
    get<string[]>('/mechanical-integrity/lookups/relationship-types')
  ]).then(([documentTypes, documentStatuses, relationshipTypes]) => ({ documentTypes, documentStatuses, relationshipTypes }))
};
