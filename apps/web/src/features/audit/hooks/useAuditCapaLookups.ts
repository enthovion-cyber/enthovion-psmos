import { useQuery } from "@tanstack/react-query";
import { auditCapaService } from "../services/audit-capa.service";

export function useAuditCapaLookups() {
  return useQuery({ queryKey: ["audit", "capa", "context"], queryFn: () => auditCapaService.context() });
}
