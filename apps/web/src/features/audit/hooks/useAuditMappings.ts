import { useQuery } from "@tanstack/react-query";
import { auditMappingService } from "../services/audit-mapping.service";
export function useAuditMappings(filters: Record<string, unknown> = {}) {
  return useQuery({ queryKey: ["audit", "standards-mapping", "register", filters], queryFn: () => auditMappingService.list(filters) });
}
export function useAuditMappingView(view: string, filters: Record<string, unknown> = {}) {
  return useQuery({ queryKey: ["audit", "standards-mapping", view, filters], queryFn: () => auditMappingService.views(view, filters) });
}
