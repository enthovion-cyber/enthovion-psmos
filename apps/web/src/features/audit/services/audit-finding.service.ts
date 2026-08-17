import { get, patch, post, remove } from "./audit-api";
import type { AuditFindingContext, AuditFindingDashboard, AuditFindingDetail, AuditFindingRegister } from "../types/audit-finding.types";

export const auditFindingService = {
  dashboard: (params?: Record<string, unknown>) => get<AuditFindingDashboard>("/audit-compliance/findings/dashboard", params),
  register: (params?: Record<string, unknown>) => get<AuditFindingRegister>("/audit-compliance/findings", params),
  context: () => get<AuditFindingContext>("/audit-compliance/findings/context"),
  lookups: () => get<Record<string, any>>("/audit-compliance/findings/context").then((ctx) => ctx.lookups),
  settings: (siteId?: string) => get<Record<string, any>>("/audit-compliance/findings/settings", siteId ? { siteId } : undefined),
  updateSettings: (payload: Record<string, unknown>) => patch<Record<string, any>>("/audit-compliance/findings/settings", payload),
  detail: (id: string) => get<AuditFindingDetail>(`/audit-compliance/findings/${id}`),
  create: (payload: Record<string, unknown>) => post<AuditFindingDetail>("/audit-compliance/findings", payload),
  update: (id: string, payload: Record<string, unknown>) => patch<AuditFindingDetail>(`/audit-compliance/findings/${id}`, payload),
  action: (id: string, action: string, payload: Record<string, unknown> = {}) => post<AuditFindingDetail>(`/audit-compliance/findings/${id}/${action}`, payload),
  section: (id: string, section: string) => get<Record<string, any>[]>(`/audit-compliance/findings/${id}/${section}`),
  addSection: (id: string, section: string, payload: Record<string, unknown>) => post<AuditFindingDetail>(`/audit-compliance/findings/${id}/${section}`, payload),
  updateSection: (id: string, section: string, rowId: string, payload: Record<string, unknown>) => patch<AuditFindingDetail>(`/audit-compliance/findings/${id}/${section}/${rowId}`, payload),
  removeSection: (id: string, section: string, rowId: string, reason: string) => remove<AuditFindingDetail>(`/audit-compliance/findings/${id}/${section}/${rowId}`, { reason }),
  convertOptions: (params?: Record<string, unknown>) => get<Record<string, any>>("/audit-compliance/findings/convert-from-field", params),
  convertFieldFinding: (executionId: string, fieldFindingId: string, payload: Record<string, unknown>) => post<AuditFindingDetail>(`/audit-compliance/execution/${executionId}/field-findings/${fieldFindingId}/convert`, payload),
  createFromResponse: (executionId: string, responseId: string, payload: Record<string, unknown>) => post<AuditFindingDetail>(`/audit-compliance/execution/${executionId}/responses/${responseId}/create-finding`, payload),
  checkDuplicates: (id: string, payload: Record<string, unknown> = {}) => post<AuditFindingDetail>(`/audit-compliance/findings/${id}/check-duplicates`, payload),
  calculateReadiness: (id: string) => post<AuditFindingDetail>(`/audit-compliance/findings/${id}/calculate-readiness`),
};
