import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { auditMappingGapService } from "../services/audit-mapping-gap.service";
export function useAuditMappingGaps(filters: Record<string, unknown> = {}) {
  return useQuery({ queryKey: ["audit", "standards-mapping", "gaps", filters], queryFn: () => auditMappingGapService.list(filters) });
}
export function useAuditMappingGapMutations() {
  const qc = useQueryClient();
  return {
    detect: useMutation({ mutationFn: (mappingId?: string) => auditMappingGapService.detect(mappingId), onSuccess: () => qc.invalidateQueries({ queryKey: ["audit", "standards-mapping"] }) }),
    resolve: useMutation({ mutationFn: ({ id, payload }: { id: string; payload: Record<string, unknown> }) => auditMappingGapService.resolve(id, payload), onSuccess: () => qc.invalidateQueries({ queryKey: ["audit", "standards-mapping"] }) }),
  };
}
