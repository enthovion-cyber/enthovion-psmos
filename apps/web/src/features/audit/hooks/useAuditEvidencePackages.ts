import { useQuery } from "@tanstack/react-query";
import { auditEvidenceService } from "../services/audit-evidence.service";

export function useAuditEvidencePackages(filters: Record<string, unknown> = {}) {
  return useQuery({ queryKey: ["audit", "evidence", "packages", filters], queryFn: () => auditEvidenceService.packages(filters) });
}
