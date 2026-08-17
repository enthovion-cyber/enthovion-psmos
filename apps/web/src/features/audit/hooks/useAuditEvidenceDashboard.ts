import { useQuery } from "@tanstack/react-query";
import { auditEvidenceService } from "../services/audit-evidence.service";

export function useAuditEvidenceDashboard(filters: Record<string, unknown> = {}) {
  return useQuery({ queryKey: ["audit", "evidence", "dashboard", filters], queryFn: () => auditEvidenceService.dashboard(filters) });
}
