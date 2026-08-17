import { get, patch, post } from '@/features/audit/services/audit-api';
import type { RegulatoryDetail } from '../types/regulatory.types';

export const regulatoryItemService = {
  detail: (id: string) => get<RegulatoryDetail>(`/regulatory/${id}`),
  section: (id: string, section: string) => get<RegulatoryDetail>(`/regulatory/${id}/${section}`),
  create: (data: Record<string, unknown>) => post<RegulatoryDetail>('/regulatory', data),
  update: (id: string, data: Record<string, unknown>) => patch<RegulatoryDetail>(`/regulatory/${id}`, data),
  archive: (id: string, data: Record<string, unknown>) => post<RegulatoryDetail>(`/regulatory/${id}/archive`, data),
  reactivate: (id: string, data: Record<string, unknown>) => post<RegulatoryDetail>(`/regulatory/${id}/reactivate`, data),
  lock: (id: string, data: Record<string, unknown>) => post<RegulatoryDetail>(`/regulatory/${id}/lock`, data),
  unlock: (id: string, data: Record<string, unknown>) => post<RegulatoryDetail>(`/regulatory/${id}/unlock`, data),
  assignOwner: (id: string, data: Record<string, unknown>) => post<RegulatoryDetail>(`/regulatory/${id}/assign-owner`, data),
  changeStatus: (id: string, data: Record<string, unknown>) => post<RegulatoryDetail>(`/regulatory/${id}/change-status`, data),
  changeApplicability: (id: string, data: Record<string, unknown>) => post<RegulatoryDetail>(`/regulatory/${id}/change-applicability`, data),
  changeComplianceStatus: (id: string, data: Record<string, unknown>) => post<RegulatoryDetail>(`/regulatory/${id}/change-compliance-status`, data)
};
