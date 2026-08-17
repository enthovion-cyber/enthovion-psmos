import { get, patch, post } from "./audit-api";
import type { AuditRow } from "../types/audit-standard-mapping.types";

export const auditClauseService = {
  list: (params?: Record<string, unknown>) => get<{ rows: AuditRow[]; total: number; page: number; limit: number }>("/audit-compliance/standards-mapping/clauses", params),
  detail: (id: string) => get<AuditRow>(`/audit-compliance/standards-mapping/clauses/${id}`),
  save: (payload: Record<string, unknown>, id?: string) => id ? patch<AuditRow>(`/audit-compliance/standards-mapping/clauses/${id}`, payload) : post<AuditRow>("/audit-compliance/standards-mapping/clauses", payload),
  archive: (id: string, reason: string) => post<AuditRow>(`/audit-compliance/standards-mapping/clauses/${id}/archive`, { reason }),
};
