import { useQuery } from "@tanstack/react-query";
import { auditCapaService } from "../services/audit-capa.service";

export function useAuditCapaEffectiveness(capaId: string) {
  return useQuery({ queryKey: ["audit", "capa", capaId, "effectiveness"], queryFn: () => auditCapaService.section(capaId, "effectiveness"), enabled: Boolean(capaId) });
}
