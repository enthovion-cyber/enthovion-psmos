import { useQuery } from "@tanstack/react-query";
import { auditCapaService } from "../services/audit-capa.service";

export function useAuditCapaDetail(capaId: string) {
  return useQuery({ queryKey: ["audit", "capa", "detail", capaId], queryFn: () => auditCapaService.detail(capaId), enabled: Boolean(capaId) });
}
