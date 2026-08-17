import { useQuery } from "@tanstack/react-query";
import { auditExecutionService } from "../services/audit-execution.service";

export function useAuditExecutions(filters: Record<string, unknown> = {}) {
  return useQuery({ queryKey: ["audit", "execution", "register", filters], queryFn: () => auditExecutionService.register(filters) });
}
