import { useQuery } from "@tanstack/react-query";
import { auditChecklistService as s } from "../services/audit-checklist.service";
export function useAuditChecklistItems(id: string) {
  return useQuery({
    queryKey: ["audit", "checklists", id, "items"],
    queryFn: () => s.children(id, "items"),
  });
}
