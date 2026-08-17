import { useQuery } from "@tanstack/react-query";
import { auditChecklistService } from "../services/audit-checklist.service";
export function useAuditChecklistDashboard(
  params: Record<string, unknown> = {},
) {
  return useQuery({
    queryKey: ["audit", "checklists", "dashboard", params],
    queryFn: () => auditChecklistService.dashboard(params),
  });
}
