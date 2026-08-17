import { get, patch, post } from '@/features/audit/services/audit-api';
import type { RegulatoryList, RegulatoryRow } from '../types/regulatory-applicability.types';

export const regulatoryJurisdictionService = {
  dashboard: (params?: Record<string, unknown>) => get<RegulatoryRow>('/regulatory/jurisdictions/dashboard', params),
  summary: (params?: Record<string, unknown>) => get<RegulatoryRow>('/regulatory/jurisdictions/dashboard/summary', params),
  list: (params?: Record<string, unknown>) => get<RegulatoryList>('/regulatory/jurisdictions', params),
  register: (params?: Record<string, unknown>) => get<RegulatoryList>('/regulatory/jurisdictions/register', params),
  detail: (id: string) => get<RegulatoryRow>(`/regulatory/jurisdictions/${id}`),
  create: (data: RegulatoryRow) => post<RegulatoryRow>('/regulatory/jurisdictions', data),
  update: (id: string, data: RegulatoryRow) => patch<RegulatoryRow>(`/regulatory/jurisdictions/${id}`, data),
  archive: (id: string, reason: string) => post<RegulatoryRow>(`/regulatory/jurisdictions/${id}/archive`, { reason }),
  reactivate: (id: string, reason: string) => post<RegulatoryRow>(`/regulatory/jurisdictions/${id}/reactivate`, { reason }),
  authorities: (id: string) => get<RegulatoryList>(`/regulatory/jurisdictions/${id}/authorities`),
  sites: (id: string) => get<RegulatoryList>(`/regulatory/jurisdictions/${id}/sites`),
  registerItems: (id: string) => get<RegulatoryList>(`/regulatory/jurisdictions/${id}/register-items`),
  applicability: (id: string) => get<RegulatoryList>(`/regulatory/jurisdictions/${id}/applicability`),
  history: (id: string) => get<RegulatoryList>(`/regulatory/jurisdictions/${id}/history`),
  link: (itemId: string, data: RegulatoryRow) => post<RegulatoryRow>(`/regulatory/${itemId}/jurisdictions`, data)
};
