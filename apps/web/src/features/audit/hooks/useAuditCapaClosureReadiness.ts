import { useQuery } from "@tanstack/react-query";
import { auditCapaService } from "../services/audit-capa.service";

export function useAuditCapaClosureReadiness(capaId: string) {
  return useQuery({ queryKey: ["audit", "capa", capaId, "closure-readiness"], queryFn: () => auditCapaService.section(capaId, "closure-readiness"), enabled: Boolean(capaId) });
}
