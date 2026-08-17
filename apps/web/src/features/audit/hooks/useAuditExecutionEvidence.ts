import { useMutation, useQueryClient } from "@tanstack/react-query";
import { auditExecutionEvidenceService } from "../services/audit-execution-evidence.service";

export function useAuditExecutionEvidence() {
  const client = useQueryClient();
  const invalidate = () => client.invalidateQueries({ queryKey: ["audit", "execution"] });
  return {
    add: useMutation({ mutationFn: ({ executionId, payload }: { executionId: string; payload: Record<string, unknown> }) => auditExecutionEvidenceService.add(executionId, payload), onSuccess: invalidate }),
    update: useMutation({ mutationFn: ({ executionId, evidenceId, payload }: { executionId: string; evidenceId: string; payload: Record<string, unknown> }) => auditExecutionEvidenceService.update(executionId, evidenceId, payload), onSuccess: invalidate }),
    remove: useMutation({ mutationFn: ({ executionId, evidenceId, reason }: { executionId: string; evidenceId: string; reason: string }) => auditExecutionEvidenceService.remove(executionId, evidenceId, reason), onSuccess: invalidate }),
  };
}
