import { useQuery } from "@tanstack/react-query";
import { auditCapaService } from "../services/audit-capa.service";

export function useAuditCapaEvidence(capaId: string) {
  return useQuery({ queryKey: ["audit", "capa", capaId, "evidence"], queryFn: () => auditCapaService.section(capaId, "evidence"), enabled: Boolean(capaId) });
}
