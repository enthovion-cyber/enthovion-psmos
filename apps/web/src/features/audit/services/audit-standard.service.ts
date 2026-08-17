import { get, patch, post } from "./audit-api";
import type { AuditRow } from "../types/audit-standard-mapping.types";

export const auditStandardService = {
  list: (params?: Record<string, unknown>) => get<{ rows: AuditRow[]; total: number; page: number; limit: number }>("/audit-compliance/standards-mapping/standards", params),
  detail: (id: string) => get<AuditRow>(`/audit-compliance/standards-mapping/standards/${id}`),
  save: (payload: Record<string, unknown>, id?: string) => id ? patch<AuditRow>(`/audit-compliance/standards-mapping/standards/${id}`, payload) : post<AuditRow>("/audit-compliance/standards-mapping/standards", payload),
  archive: (id: string, reason: string) => post<AuditRow>(`/audit-compliance/standards-mapping/standards/${id}/archive`, { reason }),
  reactivate: (id: string, reason: string) => post<AuditRow>(`/audit-compliance/standards-mapping/standards/${id}/reactivate`, { reason }),
};
