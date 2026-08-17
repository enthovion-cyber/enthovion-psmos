import { useQuery } from "@tanstack/react-query";
import { auditExecutionService } from "../services/audit-execution.service";

export function useAuditExecutionDetail(id?: string) {
  return useQuery({ queryKey: ["audit", "execution", "detail", id], queryFn: () => auditExecutionService.detail(id as string), enabled: Boolean(id) });
}
