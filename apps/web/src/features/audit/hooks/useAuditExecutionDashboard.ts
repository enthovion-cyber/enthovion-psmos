import { useQuery } from "@tanstack/react-query";
import { auditExecutionService } from "../services/audit-execution.service";

export function useAuditExecutionDashboard(filters: Record<string, unknown> = {}) {
  return useQuery({ queryKey: ["audit", "execution", "dashboard", filters], queryFn: () => auditExecutionService.dashboard(filters) });
}
