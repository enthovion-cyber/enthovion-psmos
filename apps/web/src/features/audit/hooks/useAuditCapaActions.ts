import { useQuery } from "@tanstack/react-query";
import { auditCapaService } from "../services/audit-capa.service";

export function useAuditCapaActions(capaId: string) {
  return useQuery({ queryKey: ["audit", "capa", capaId, "actions"], queryFn: () => auditCapaService.section(capaId, "actions"), enabled: Boolean(capaId) });
}
