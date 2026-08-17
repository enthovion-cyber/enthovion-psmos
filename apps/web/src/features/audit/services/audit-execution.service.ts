import { get, patch, post } from "./audit-api";
import type { AuditExecutionDashboard, AuditExecutionDetail, AuditExecutionRegister } from "../types/audit-execution.types";

export const auditExecutionService = {
  dashboard: (params?: Record<string, unknown>) => get<AuditExecutionDashboard>("/audit-compliance/execution/dashboard", params),
  register: (params?: Record<string, unknown>) => get<AuditExecutionRegister>("/audit-compliance/execution", params),
  context: () => get<Record<string, any>>("/audit-compliance/execution/context"),
  lookups: () => get<Record<string, any>>("/audit-compliance/execution/lookups"),
  settings: (siteId?: string) => get<Record<string, any>>("/audit-compliance/execution/settings", siteId ? { siteId } : undefined),
  updateSettings: (payload: Record<string, unknown>) => patch<Record<string, any>>("/audit-compliance/execution/settings", payload),
  detail: (id: string) => get<AuditExecutionDetail>(`/audit-compliance/execution/${id}`),
  workspace: (id: string) => get<AuditExecutionDetail>(`/audit-compliance/execution/${id}/workspace`),
  create: (payload: Record<string, unknown>) => post<AuditExecutionDetail>("/audit-compliance/execution", payload),
  startFromPlan: (planId: string, payload: Record<string, unknown>) => post<AuditExecutionDetail>(`/audit-compliance/plans/${planId}/start-execution`, payload),
  planExecution: (planId: string) => get<Record<string, any>>(`/audit-compliance/plans/${planId}/execution`),
  planReadiness: (planId: string) => get<Record<string, any>>(`/audit-compliance/plans/${planId}/execution-readiness`),
  update: (id: string, payload: Record<string, unknown>) => patch<AuditExecutionDetail>(`/audit-compliance/execution/${id}`, payload),
  action: (id: string, action: string, payload: Record<string, unknown> = {}) => post<AuditExecutionDetail>(`/audit-compliance/execution/${id}/${action}`, payload),
  readiness: (id: string, run = false) => run ? post<Record<string, any>>(`/audit-compliance/execution/${id}/readiness/run`) : get<Record<string, any>>(`/audit-compliance/execution/${id}/readiness`),
  validate: (id: string) => post<Record<string, any>>(`/audit-compliance/execution/${id}/validate`),
};
