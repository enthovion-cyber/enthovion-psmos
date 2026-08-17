import { useQuery } from "@tanstack/react-query";
import { auditCapaService } from "../services/audit-capa.service";

export function useAuditCapaVerification(capaId: string) {
  return useQuery({ queryKey: ["audit", "capa", capaId, "verification"], queryFn: () => auditCapaService.section(capaId, "verification"), enabled: Boolean(capaId) });
}
