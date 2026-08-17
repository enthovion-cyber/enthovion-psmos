import { get, patch, post } from '@/features/audit/services/audit-api';
import type { RegulatoryList, RegulatoryRow } from '../types/regulatory-applicability.types';

export const regulatoryApplicabilityGapService = {
  list: (params?: Record<string, unknown>) => get<RegulatoryList>('/regulatory/applicability/gaps', params),
  detect: (data: RegulatoryRow) => post<RegulatoryList>('/regulatory/applicability/gaps/detect', data),
  create: (data: RegulatoryRow) => post<RegulatoryRow>('/regulatory/applicability/gaps', data),
  update: (id: string, data: RegulatoryRow) => patch<RegulatoryRow>(`/regulatory/applicability/gaps/${id}`, data),
  resolve: (id: string, reason: string) => post<RegulatoryRow>(`/regulatory/applicability/gaps/${id}/resolve`, { reason }),
  createActionFoundation: (id: string, data: RegulatoryRow) => post<RegulatoryRow>(`/regulatory/applicability/gaps/${id}/create-action-foundation`, data)
};
