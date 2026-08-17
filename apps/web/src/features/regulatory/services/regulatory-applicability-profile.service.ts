import { get, patch, post, remove } from '@/features/audit/services/audit-api';
import type { RegulatoryList, RegulatoryRow } from '../types/regulatory-applicability.types';

export const regulatoryApplicabilityProfileService = {
  list: (params?: Record<string, unknown>) => get<RegulatoryList>('/regulatory/applicability/profiles', params),
  detail: (id: string) => get<RegulatoryRow>(`/regulatory/applicability/profiles/${id}`),
  create: (data: RegulatoryRow) => post<RegulatoryRow>('/regulatory/applicability/profiles', data),
  update: (id: string, data: RegulatoryRow) => patch<RegulatoryRow>(`/regulatory/applicability/profiles/${id}`, data),
  archive: (id: string, reason: string) => post<RegulatoryRow>(`/regulatory/applicability/profiles/${id}/archive`, { reason }),
  reactivate: (id: string, reason: string) => post<RegulatoryRow>(`/regulatory/applicability/profiles/${id}/reactivate`, { reason }),
  criteria: (id: string) => get<RegulatoryList>(`/regulatory/applicability/profiles/${id}/criteria`),
  createCriterion: (id: string, data: RegulatoryRow) => post<RegulatoryRow>(`/regulatory/applicability/profiles/${id}/criteria`, data),
  updateCriterion: (id: string, data: RegulatoryRow) => patch<RegulatoryRow>(`/regulatory/applicability/criteria/${id}`, data),
  deleteCriterion: (id: string) => remove<{ ok: boolean }>(`/regulatory/applicability/criteria/${id}`),
  reorderCriteria: (id: string, criteria: RegulatoryRow[]) => post<RegulatoryList>(`/regulatory/applicability/profiles/${id}/criteria/reorder`, { criteria })
};
