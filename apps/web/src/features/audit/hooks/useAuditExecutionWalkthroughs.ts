import { useMutation, useQueryClient } from "@tanstack/react-query";
import { post, patch, remove } from "../services/audit-api";

export function useAuditExecutionWalkthroughs() {
  const client = useQueryClient();
  const invalidate = () => client.invalidateQueries({ queryKey: ["audit", "execution"] });
  return {
    add: useMutation({ mutationFn: ({ executionId, payload }: { executionId: string; payload: Record<string, unknown> }) => post(`/audit-compliance/execution/${executionId}/walkthroughs`, payload), onSuccess: invalidate }),
    update: useMutation({ mutationFn: ({ executionId, walkthroughId, payload }: { executionId: string; walkthroughId: string; payload: Record<string, unknown> }) => patch(`/audit-compliance/execution/${executionId}/walkthroughs/${walkthroughId}`, payload), onSuccess: invalidate }),
    remove: useMutation({ mutationFn: ({ executionId, walkthroughId, reason }: { executionId: string; walkthroughId: string; reason: string }) => remove(`/audit-compliance/execution/${executionId}/walkthroughs/${walkthroughId}`, { reason }), onSuccess: invalidate }),
  };
}
