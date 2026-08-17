import { useQuery } from "@tanstack/react-query";
import { auditEvidenceService } from "../services/audit-evidence.service";

export function useAuditEvidenceRequirements(filters: Record<string, unknown> = {}) {
  return useQuery({ queryKey: ["audit", "evidence", "requirements", filters], queryFn: () => auditEvidenceService.requirements(filters) });
}
