import { get, patch, post, remove } from "./audit-api";
import type { AuditMappingRegister, AuditRow, AuditStandardMappingContext, AuditStandardMappingDashboard, AuditStandardMappingDetail } from "../types/audit-standard-mapping.types";

export const auditMappingService = {
  dashboard: (params?: Record<string, unknown>) => get<AuditStandardMappingDashboard>("/audit-compliance/standards-mapping/dashboard", params),
  context: () => get<AuditStandardMappingContext>("/audit-compliance/standards-mapping/context"),
  lookups: () => get<AuditRow>("/audit-compliance/standards-mapping/lookups"),
  list: (params?: Record<string, unknown>) => get<AuditMappingRegister>("/audit-compliance/standards-mapping/register", params),
  views: (view: string, params?: Record<string, unknown>) => get<AuditMappingRegister>(`/audit-compliance/standards-mapping/${view}`, params),
  detail: (id: string) => get<AuditStandardMappingDetail>(`/audit-compliance/standards-mapping/${id}`),
  save: (payload: Record<string, unknown>, id?: string) => id ? patch<AuditStandardMappingDetail>(`/audit-compliance/standards-mapping/${id}`, payload) : post<AuditStandardMappingDetail>("/audit-compliance/standards-mapping", payload),
  link: (id: string, payload: Record<string, unknown>) => post<AuditStandardMappingDetail>(`/audit-compliance/standards-mapping/${id}/link`, payload),
  unlink: (id: string, linkId: string, payload?: Record<string, unknown>) => remove<AuditStandardMappingDetail>(`/audit-compliance/standards-mapping/${id}/links/${linkId}`, payload),
  recalculate: (id?: string) => id ? post<AuditStandardMappingDetail>(`/audit-compliance/standards-mapping/${id}/recalculate`) : post<AuditRow>("/audit-compliance/standards-mapping/coverage/recalculate"),
  transition: (id: string, action: "verify" | "mark-stale" | "archive" | "reopen", payload?: Record<string, unknown>) => post<AuditStandardMappingDetail>(`/audit-compliance/standards-mapping/${id}/${action}`, payload),
  snapshotTraceability: (id: string) => post<AuditStandardMappingDetail>(`/audit-compliance/standards-mapping/${id}/generate-traceability-snapshot`),
  createOverride: (id: string, payload: Record<string, unknown>) => post<AuditStandardMappingDetail>(`/audit-compliance/standards-mapping/${id}/overrides`, payload),
  overrideTransition: (id: string, overrideId: string, action: "approve" | "reject" | "remove", payload?: Record<string, unknown>) => post<AuditStandardMappingDetail>(`/audit-compliance/standards-mapping/${id}/overrides/${overrideId}/${action}`, payload),
  source: (path: string, params?: Record<string, unknown>) => get<AuditMappingRegister>(`/audit-compliance/${path}/standards-mapping`, params),
};
