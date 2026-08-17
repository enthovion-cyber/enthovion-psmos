import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { auditStandardService } from "../services/audit-standard.service";
export function useAuditStandards(filters: Record<string, unknown> = {}) {
  return useQuery({ queryKey: ["audit", "standards-mapping", "standards", filters], queryFn: () => auditStandardService.list(filters) });
}
export function useAuditStandard(id?: string) {
  return useQuery({ queryKey: ["audit", "standards-mapping", "standards", id], queryFn: () => auditStandardService.detail(String(id)), enabled: Boolean(id) });
}
export function useAuditStandardMutations() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ({ payload, id }: { payload: Record<string, unknown>; id?: string }) => auditStandardService.save(payload, id), onSuccess: () => qc.invalidateQueries({ queryKey: ["audit", "standards-mapping"] }) });
}
