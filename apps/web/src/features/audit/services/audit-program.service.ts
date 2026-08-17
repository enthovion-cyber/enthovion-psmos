import type { AuditContext, AuditDetail, AuditRegister } from '../types/audit.types';
import { get, patch, post } from './audit-api';

export const auditProgramService = {
  register: (params?: Record<string, unknown>) => get<AuditRegister>('/audit-compliance/programs', params),
  context: () => get<AuditContext>('/audit-compliance/context'),
  detail: (programId: string) => get<AuditDetail>(`/audit-compliance/programs/${programId}`),
  create: (payload: Record<string, unknown>) => post<AuditDetail>('/audit-compliance/programs', payload),
  update: (programId: string, payload: Record<string, unknown>) => patch<AuditDetail>(`/audit-compliance/programs/${programId}`, payload),
  activate: (programId: string) => post<AuditDetail>(`/audit-compliance/programs/${programId}/activate`),
  archive: (programId: string, reason: string) => post<AuditDetail>(`/audit-compliance/programs/${programId}/archive`, { reason }),
  reactivate: (programId: string) => post<AuditDetail>(`/audit-compliance/programs/${programId}/reactivate`),
  submitReview: (programId: string) => post<AuditDetail>(`/audit-compliance/programs/${programId}/submit-review`),
  calculateHealth: (programId: string) => post(`/audit-compliance/programs/${programId}/calculate-health`)
};
