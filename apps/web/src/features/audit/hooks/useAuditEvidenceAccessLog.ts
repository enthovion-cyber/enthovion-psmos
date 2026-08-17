import { useQuery } from "@tanstack/react-query";
import { auditEvidenceService } from "../services/audit-evidence.service";

export function useAuditEvidenceAccessLog(filters: Record<string, unknown> = {}) {
  return useQuery({ queryKey: ["audit", "evidence", "access-log", filters], queryFn: () => auditEvidenceService.accessLog(filters) });
}
