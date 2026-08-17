import { useMutation, useQueryClient } from "@tanstack/react-query";
import { post, patch, remove } from "../services/audit-api";

export function useAuditExecutionInterviews() {
  const client = useQueryClient();
  const invalidate = () => client.invalidateQueries({ queryKey: ["audit", "execution"] });
  return {
    add: useMutation({ mutationFn: ({ executionId, payload }: { executionId: string; payload: Record<string, unknown> }) => post(`/audit-compliance/execution/${executionId}/interviews`, payload), onSuccess: invalidate }),
    update: useMutation({ mutationFn: ({ executionId, interviewId, payload }: { executionId: string; interviewId: string; payload: Record<string, unknown> }) => patch(`/audit-compliance/execution/${executionId}/interviews/${interviewId}`, payload), onSuccess: invalidate }),
    remove: useMutation({ mutationFn: ({ executionId, interviewId, reason }: { executionId: string; interviewId: string; reason: string }) => remove(`/audit-compliance/execution/${executionId}/interviews/${interviewId}`, { reason }), onSuccess: invalidate }),
  };
}
