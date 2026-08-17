import { useQuery } from "@tanstack/react-query";
import { auditScoringService } from "../services/audit-scoring.service";
export function useAuditScoringDashboard(filters: Record<string, unknown> = {}) {
  return useQuery({ queryKey: ["audit", "scoring", "dashboard", filters], queryFn: () => auditScoringService.dashboard(filters) });
}
