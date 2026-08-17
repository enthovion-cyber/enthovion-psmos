import { useQuery } from "@tanstack/react-query";
import { auditMappingService } from "../services/audit-mapping.service";
export function useAuditMappingDetail(id?: string) {
  return useQuery({ queryKey: ["audit", "standards-mapping", "detail", id], queryFn: () => auditMappingService.detail(String(id)), enabled: Boolean(id) });
}
