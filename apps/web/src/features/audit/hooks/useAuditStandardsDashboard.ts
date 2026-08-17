import { useQuery } from "@tanstack/react-query";
import { auditMappingService } from "../services/audit-mapping.service";
export function useAuditStandardsDashboard(filters: Record<string, unknown> = {}) {
  return useQuery({ queryKey: ["audit", "standards-mapping", "dashboard", filters], queryFn: () => auditMappingService.dashboard(filters) });
}
