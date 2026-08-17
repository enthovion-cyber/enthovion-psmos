import { useMutation } from "@tanstack/react-query";
import { auditChecklistService as s } from "../services/audit-checklist.service";
export function useAuditChecklistReadiness() {
  return useMutation({ mutationFn: (id: string) => s.readiness(id) });
}
