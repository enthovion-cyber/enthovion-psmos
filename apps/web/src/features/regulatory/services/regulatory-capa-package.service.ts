import { get, patch, post, remove } from '@/features/audit/services/audit-api';
import type { RegulatoryCapaPackage, RegulatoryCapaPackageRegister } from '../types/regulatory-action.types';

export const regulatoryCapaPackageService = {
  register: (params?: Record<string, unknown>) => get<RegulatoryCapaPackageRegister>('/regulatory/actions/capa', params),
  create: (data: Record<string, unknown>) => post<{ package: RegulatoryCapaPackage }>('/regulatory/actions/capa', data),
  detail: (capaPackageId: string) => get<{ package: RegulatoryCapaPackage }>(`/regulatory/actions/capa/${capaPackageId}`),
  section: (capaPackageId: string, section: string) => get<Record<string, unknown>>(`/regulatory/actions/capa/${capaPackageId}/${section}`),
  update: (capaPackageId: string, data: Record<string, unknown>) => patch<{ package: RegulatoryCapaPackage }>(`/regulatory/actions/capa/${capaPackageId}`, data),
  addSource: (capaPackageId: string, data: Record<string, unknown>) => post<Record<string, unknown>>(`/regulatory/actions/capa/${capaPackageId}/sources`, data),
  addAction: (capaPackageId: string, data: Record<string, unknown>) => post<Record<string, unknown>>(`/regulatory/actions/capa/${capaPackageId}/actions`, data),
  removeAction: (capaPackageId: string, actionLinkId: string, reason: string) => remove<Record<string, unknown>>(`/regulatory/actions/capa/${capaPackageId}/actions/${actionLinkId}`, { reason }),
  checkReadiness: (capaPackageId: string) => post<Record<string, unknown>>(`/regulatory/actions/capa/${capaPackageId}/closure-readiness/check`, {}),
  verify: (capaPackageId: string, data: Record<string, unknown>) => post<Record<string, unknown>>(`/regulatory/actions/capa/${capaPackageId}/verification`, data),
  effectiveness: (capaPackageId: string, data: Record<string, unknown>) => post<Record<string, unknown>>(`/regulatory/actions/capa/${capaPackageId}/effectiveness`, data),
  closeFoundation: (capaPackageId: string, data: Record<string, unknown>) => post<Record<string, unknown>>(`/regulatory/actions/capa/${capaPackageId}/close-foundation`, data),
  reopen: (capaPackageId: string, data: Record<string, unknown>) => post<Record<string, unknown>>(`/regulatory/actions/capa/${capaPackageId}/reopen`, data),
  archive: (capaPackageId: string, reason: string) => post<Record<string, unknown>>(`/regulatory/actions/capa/${capaPackageId}/archive`, { reason })
};
