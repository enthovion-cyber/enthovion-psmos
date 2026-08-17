import { get, patch, post } from '@/features/audit/services/audit-api';
import type { RegulatoryList, RegulatoryRow } from '../types/regulatory-applicability.types';

export const regulatoryAuthorityService = {
  list: (params?: Record<string, unknown>) => get<RegulatoryList>('/regulatory/authorities', params),
  detail: (id: string) => get<RegulatoryRow>(`/regulatory/authorities/${id}`),
  create: (data: RegulatoryRow) => post<RegulatoryRow>('/regulatory/authorities', data),
  update: (id: string, data: RegulatoryRow) => patch<RegulatoryRow>(`/regulatory/authorities/${id}`, data),
  archive: (id: string, reason: string) => post<RegulatoryRow>(`/regulatory/authorities/${id}/archive`, { reason }),
  reactivate: (id: string, reason: string) => post<RegulatoryRow>(`/regulatory/authorities/${id}/reactivate`, { reason }),
  linkJurisdiction: (data: RegulatoryRow) => post<RegulatoryRow>('/regulatory/jurisdiction-authorities', data)
};
