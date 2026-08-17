import { useQuery } from "@tanstack/react-query";
import { auditExecutionService } from "../services/audit-execution.service";

export function useAuditExecutionLookups() {
  return useQuery({ queryKey: ["audit", "execution", "lookups"], queryFn: () => auditExecutionService.context() });
}
