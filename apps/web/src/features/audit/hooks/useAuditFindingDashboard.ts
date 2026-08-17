import { useQuery } from "@tanstack/react-query";
import { auditFindingService } from "../services/audit-finding.service";

export function useAuditFindingDashboard(filters: Record<string, unknown> = {}) {
  return useQuery({ queryKey: ["audit", "findings", "dashboard", filters], queryFn: () => auditFindingService.dashboard(filters) });
}
