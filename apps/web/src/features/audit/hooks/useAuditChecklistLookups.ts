import { useQuery } from "@tanstack/react-query";
import { auditChecklistService as s } from "../services/audit-checklist.service";
export function useAuditChecklistLookups() {
  return useQuery({
    queryKey: ["audit", "checklists", "context"],
    queryFn: s.context,
  });
}
