import { useQuery } from "@tanstack/react-query";
import { auditFindingService } from "../services/audit-finding.service";

export function useAuditFindingEvidence(findingId: string) {
  return useQuery({ queryKey: ["audit", "findings", findingId, "evidence"], queryFn: () => auditFindingService.section(findingId, "evidence"), enabled: Boolean(findingId) });
}
