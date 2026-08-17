import { useQuery } from "@tanstack/react-query";
import { auditFindingService } from "../services/audit-finding.service";

export function useAuditFindingConversion(filters: Record<string, unknown> = {}) {
  return useQuery({ queryKey: ["audit", "findings", "conversion", filters], queryFn: () => auditFindingService.convertOptions(filters) });
}
