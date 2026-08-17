import { get, patch, post, remove } from "./audit-api";
import type { AuditCapaContext, AuditCapaDashboard, AuditCapaDetail, AuditCapaRegister } from "../types/audit-capa.types";

export const auditCapaService = {
  dashboard: (params?: Record<string, unknown>) => get<AuditCapaDashboard>("/audit-compliance/capa/dashboard", params),
  register: (params?: Record<string, unknown>) => get<AuditCapaRegister>("/audit-compliance/capa", params),
  context: () => get<AuditCapaContext>("/audit-compliance/capa/context"),
  lookups: () => get<AuditCapaContext>("/audit-compliance/capa/context").then((ctx) => ctx.lookups),
  settings: (siteId?: string) => get<Record<string, any>>("/audit-compliance/capa/settings", siteId ? { siteId } : undefined),
  updateSettings: (payload: Record<string, unknown>) => patch<Record<string, any>>("/audit-compliance/capa/settings", payload),
  detail: (id: string) => get<AuditCapaDetail>(`/audit-compliance/capa/${id}`),
  create: (payload: Record<string, unknown>) => post<AuditCapaDetail>("/audit-compliance/capa", payload),
  createFromFinding: (findingId: string, payload: Record<string, unknown>) => post<AuditCapaDetail>(`/audit-compliance/findings/${findingId}/create-capa`, payload),
  update: (id: string, payload: Record<string, unknown>) => patch<AuditCapaDetail>(`/audit-compliance/capa/${id}`, payload),
  transition: (id: string, action: string, payload: Record<string, unknown> = {}) => post<AuditCapaDetail>(`/audit-compliance/capa/${id}/${action}`, payload),
  section: (id: string, section: string) => get<Record<string, any>[]>(`/audit-compliance/capa/${id}/${section}`),
  addSection: (id: string, section: string, payload: Record<string, unknown>) => post<AuditCapaDetail>(`/audit-compliance/capa/${id}/${section}`, payload),
  updateSection: (id: string, section: string, rowId: string, payload: Record<string, unknown>) => patch<AuditCapaDetail>(`/audit-compliance/capa/${id}/${section}/${rowId}`, payload),
  removeSection: (id: string, section: string, rowId: string, reason: string) => remove<AuditCapaDetail>(`/audit-compliance/capa/${id}/${section}/${rowId}`, { reason }),
  actionLifecycle: (id: string, actionId: string, lifecycle: string, payload: Record<string, unknown> = {}) => post<AuditCapaDetail>(`/audit-compliance/capa/${id}/actions/${actionId}/${lifecycle}`, payload),
  runClosureReadiness: (id: string) => post<Record<string, any>>(`/audit-compliance/capa/${id}/run-closure-readiness`),
  findingCapa: (findingId: string) => get<Record<string, any>>(`/audit-compliance/findings/${findingId}/capa`),
  findingActions: (findingId: string) => get<Record<string, any>>(`/audit-compliance/findings/${findingId}/actions`),
  findingClosureReadiness: (findingId: string) => get<Record<string, any>>(`/audit-compliance/findings/${findingId}/closure-readiness`),
};
