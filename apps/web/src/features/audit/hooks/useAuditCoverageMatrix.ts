import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { auditCoverageService } from "../services/audit-coverage.service";
export function useAuditCoverageMatrix(filters: Record<string, unknown> = {}) {
  return useQuery({ queryKey: ["audit", "standards-mapping", "coverage", filters], queryFn: () => auditCoverageService.matrix(filters) });
}
export function useAuditCoverageRecalculate() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (mappingId?: string) => auditCoverageService.recalculate(mappingId), onSuccess: () => qc.invalidateQueries({ queryKey: ["audit", "standards-mapping"] }) });
}
