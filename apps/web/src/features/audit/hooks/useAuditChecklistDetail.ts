import { useQuery } from "@tanstack/react-query";
import { auditChecklistService } from "../services/audit-checklist.service";
export function useAuditChecklistDetail(id: string) {
  return useQuery({
    queryKey: ["audit", "checklists", id],
    queryFn: () => auditChecklistService.detail(id),
    enabled: Boolean(id),
  });
}
