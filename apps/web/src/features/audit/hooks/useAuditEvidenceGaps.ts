import { useQuery } from "@tanstack/react-query";
import { auditEvidenceService } from "../services/audit-evidence.service";

export function useAuditEvidenceGaps(filters: Record<string, unknown> = {}) {
  return useQuery({ queryKey: ["audit", "evidence", "gaps", filters], queryFn: () => auditEvidenceService.gaps(filters) });
}
