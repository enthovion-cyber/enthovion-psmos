import { useQuery } from "@tanstack/react-query";
import { auditCapaService } from "../services/audit-capa.service";

export function useAuditCapas(filters: Record<string, unknown> = {}) {
  return useQuery({ queryKey: ["audit", "capa", "register", filters], queryFn: () => auditCapaService.register(filters) });
}
