import { useQuery } from "@tanstack/react-query";
import { auditEvidenceService } from "../services/audit-evidence.service";

export function useAuditEvidenceRequests(filters: Record<string, unknown> = {}) {
  return useQuery({ queryKey: ["audit", "evidence", "requests", filters], queryFn: () => auditEvidenceService.requests(filters) });
}
