import { useQuery } from "@tanstack/react-query";
import { auditChecklistService as s } from "../services/audit-checklist.service";
export function useAuditChecklistSections(id: string) {
  return useQuery({
    queryKey: ["audit", "checklists", id, "sections"],
    queryFn: () => s.children(id, "sections"),
  });
}
