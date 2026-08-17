import { get, post } from "./audit-api";
import type { AuditRow } from "../types/audit-standard-mapping.types";

export const auditCoverageService = {
  matrix: (params?: Record<string, unknown>) => get<{ rows: AuditRow[]; standards: AuditRow[]; summary: AuditRow }>("/audit-compliance/standards-mapping/coverage-matrix", params),
  recalculate: (mappingId?: string) => post<AuditRow>("/audit-compliance/standards-mapping/coverage/recalculate", mappingId ? { mappingId } : {}),
};
