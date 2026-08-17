import { useQuery } from "@tanstack/react-query";
import { auditFindingService } from "../services/audit-finding.service";

export function useAuditFindingLookups() {
  return useQuery({ queryKey: ["audit", "findings", "context"], queryFn: () => auditFindingService.context() });
}
