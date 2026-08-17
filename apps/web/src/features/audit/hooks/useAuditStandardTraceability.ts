import { useQuery } from "@tanstack/react-query";
import { get } from "../services/audit-api";
import type { AuditRow } from "../types/audit-standard-mapping.types";
export function useAuditStandardTraceability(filters: Record<string, unknown> = {}) {
  return useQuery({ queryKey: ["audit", "standards-mapping", "traceability", filters], queryFn: () => get<{ rows: AuditRow[]; summary: AuditRow }>("/audit-compliance/standards-mapping/traceability", filters) });
}
