import { useQuery } from "@tanstack/react-query";
import { auditFindingService } from "../services/audit-finding.service";

export function useAuditFindingDetail(findingId: string) {
  return useQuery({ queryKey: ["audit", "findings", "detail", findingId], queryFn: () => auditFindingService.detail(findingId), enabled: Boolean(findingId) });
}
