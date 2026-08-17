import { useQuery } from "@tanstack/react-query";
import { auditCapaService } from "../services/audit-capa.service";

export function useAuditCapaFromFinding(findingId?: string) {
  return useQuery({ queryKey: ["audit", "capa", "finding", findingId], queryFn: () => auditCapaService.findingCapa(String(findingId)), enabled: Boolean(findingId) });
}
