import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { auditClauseService } from "../services/audit-clause.service";
export function useAuditClauses(filters: Record<string, unknown> = {}) {
  return useQuery({ queryKey: ["audit", "standards-mapping", "clauses", filters], queryFn: () => auditClauseService.list(filters) });
}
export function useAuditClause(id?: string) {
  return useQuery({ queryKey: ["audit", "standards-mapping", "clauses", id], queryFn: () => auditClauseService.detail(String(id)), enabled: Boolean(id) });
}
export function useAuditClauseMutations() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ({ payload, id }: { payload: Record<string, unknown>; id?: string }) => auditClauseService.save(payload, id), onSuccess: () => qc.invalidateQueries({ queryKey: ["audit", "standards-mapping"] }) });
}
