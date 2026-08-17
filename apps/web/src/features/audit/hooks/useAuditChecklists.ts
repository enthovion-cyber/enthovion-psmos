import { useQuery } from "@tanstack/react-query";
import { auditChecklistService } from "../services/audit-checklist.service";
export function useAuditChecklists(params: Record<string, unknown> = {}) {
  return useQuery({
    queryKey: ["audit", "checklists", "templates", params],
    queryFn: () => auditChecklistService.templates(params),
  });
}
