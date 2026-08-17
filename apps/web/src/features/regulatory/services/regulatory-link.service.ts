import { get, post, remove } from '@/features/audit/services/audit-api';

export const regulatoryLinkService = {
  list: (id: string) => get<{ rows: Array<Record<string, unknown>>; summary?: Record<string, number> }>(`/regulatory/${id}/links`),
  create: (id: string, data: Record<string, unknown>) => post<Record<string, unknown>>(`/regulatory/${id}/links`, data),
  remove: (id: string, linkId: string, data: Record<string, unknown>) => remove<Record<string, unknown>>(`/regulatory/${id}/links/${linkId}`, data),
  linkAudit: (id: string, data: Record<string, unknown>) => post<Record<string, unknown>>(`/regulatory/${id}/link-audit-mapping`, data),
  linkEvidence: (id: string, data: Record<string, unknown>) => post<Record<string, unknown>>(`/regulatory/${id}/link-evidence`, data),
  linkAction: (id: string, data: Record<string, unknown>) => post<Record<string, unknown>>(`/regulatory/${id}/link-action`, data)
};
