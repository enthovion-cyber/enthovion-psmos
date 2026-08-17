import { useQuery } from "@tanstack/react-query";
import { auditFindingService } from "../services/audit-finding.service";

export function useAuditFindings(filters: Record<string, unknown> = {}) {
  return useQuery({ queryKey: ["audit", "findings", "register", filters], queryFn: () => auditFindingService.register(filters) });
}
