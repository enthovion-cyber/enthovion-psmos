import { useQuery } from "@tanstack/react-query";
import { auditChecklistService as s } from "../services/audit-checklist.service";
export function useAuditChecklistAssignments(planId: string) {
  return useQuery({
    queryKey: ["audit", "plans", planId, "checklist"],
    queryFn: () => s.planChecklist(planId),
  });
}
