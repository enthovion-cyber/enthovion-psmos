import { get, patch, post } from "./audit-api";
import type { AuditRow } from "../types/audit-standard-mapping.types";

export const auditMappingGapService = {
  list: (params?: Record<string, unknown>) => get<{ rows: AuditRow[]; total: number; page: number; limit: number }>("/audit-compliance/standards-mapping/gaps", params),
  detect: (mappingId?: string) => post<AuditRow>("/audit-compliance/standards-mapping/gaps/detect", mappingId ? { mappingId } : {}),
  create: (payload: Record<string, unknown>) => post<AuditRow>("/audit-compliance/standards-mapping/gaps", payload),
  update: (id: string, payload: Record<string, unknown>) => patch<AuditRow>(`/audit-compliance/standards-mapping/gaps/${id}`, payload),
  resolve: (id: string, payload: Record<string, unknown>) => post<AuditRow>(`/audit-compliance/standards-mapping/gaps/${id}/resolve`, payload),
};
