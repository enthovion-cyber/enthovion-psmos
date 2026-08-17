import { useMutation, useQueryClient } from "@tanstack/react-query";
import { auditExecutionResponseService } from "../services/audit-execution-response.service";

export function useAuditExecutionResponses() {
  const client = useQueryClient();
  const invalidate = () => client.invalidateQueries({ queryKey: ["audit", "execution"] });
  return {
    save: useMutation({ mutationFn: ({ executionId, itemId, payload }: { executionId: string; itemId: string; payload: Record<string, unknown> }) => auditExecutionResponseService.save(executionId, itemId, payload), onSuccess: invalidate }),
    update: useMutation({ mutationFn: ({ executionId, responseId, payload }: { executionId: string; responseId: string; payload: Record<string, unknown> }) => auditExecutionResponseService.update(executionId, responseId, payload), onSuccess: invalidate }),
    reopen: useMutation({ mutationFn: ({ executionId, responseId, payload }: { executionId: string; responseId: string; payload: Record<string, unknown> }) => auditExecutionResponseService.reopen(executionId, responseId, payload), onSuccess: invalidate }),
    completeSection: useMutation({ mutationFn: ({ executionId, sectionId, payload = {} }: { executionId: string; sectionId: string; payload?: Record<string, unknown> }) => auditExecutionResponseService.completeSection(executionId, sectionId, payload), onSuccess: invalidate }),
  };
}
