import { useMutation, useQueryClient } from "@tanstack/react-query";
import { auditScoringService } from "../services/audit-scoring.service";
export function useAuditScoreRunMutations(runId?: string) {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ["audit", "scoring"] });
  return {
    createRun: useMutation({ mutationFn: (payload: Record<string, unknown>) => auditScoringService.createRun(payload), onSuccess: invalidate }),
    recalculate: useMutation({ mutationFn: () => auditScoringService.recalculate(String(runId)), onSuccess: invalidate }),
    verify: useMutation({ mutationFn: (payload: Record<string, unknown>) => auditScoringService.transition(String(runId), "verify", payload), onSuccess: invalidate }),
    lock: useMutation({ mutationFn: (payload: Record<string, unknown>) => auditScoringService.transition(String(runId), "lock", payload), onSuccess: invalidate }),
    unlock: useMutation({ mutationFn: (payload: Record<string, unknown>) => auditScoringService.transition(String(runId), "unlock", payload), onSuccess: invalidate }),
    archive: useMutation({ mutationFn: (payload: Record<string, unknown>) => auditScoringService.transition(String(runId), "archive", payload), onSuccess: invalidate }),
  };
}
