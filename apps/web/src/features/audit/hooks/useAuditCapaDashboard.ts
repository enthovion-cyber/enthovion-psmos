import { useQuery } from "@tanstack/react-query";
import { auditCapaService } from "../services/audit-capa.service";

export function useAuditCapaDashboard(filters: Record<string, unknown> = {}) {
  return useQuery({ queryKey: ["audit", "capa", "dashboard", filters], queryFn: () => auditCapaService.dashboard(filters) });
}
