import { useQuery } from "@tanstack/react-query";
import { auditMappingService } from "../services/audit-mapping.service";
export function useAuditStandardLookups() {
  return useQuery({ queryKey: ["audit", "standards-mapping", "context"], queryFn: () => auditMappingService.context() });
}
