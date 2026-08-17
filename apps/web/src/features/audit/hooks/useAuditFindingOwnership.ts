import { useQuery } from "@tanstack/react-query";
import { auditFindingService } from "../services/audit-finding.service";

export function useAuditFindingOwnership(findingId: string) {
  return useQuery({ queryKey: ["audit", "findings", findingId, "ownership"], queryFn: () => auditFindingService.section(findingId, "ownership"), enabled: Boolean(findingId) });
}
