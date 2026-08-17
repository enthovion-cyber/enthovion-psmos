import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { auditFieldFindingService } from "../services/audit-field-finding.service";

export function useAuditFieldFindings(filters: Record<string, unknown> = {}) {
  return useQuery({ queryKey: ["audit", "field-findings", filters], queryFn: () => auditFieldFindingService.register(filters) });
}

export function useAuditFieldFindingMutations() {
  const client = useQueryClient();
  const invalidate = () => client.invalidateQueries({ queryKey: ["audit"] });
  return {
    add: useMutation({ mutationFn: ({ executionId, payload }: { executionId: string; payload: Record<string, unknown> }) => auditFieldFindingService.add(executionId, payload), onSuccess: invalidate }),
    update: useMutation({ mutationFn: ({ executionId, findingId, payload }: { executionId: string; findingId: string; payload: Record<string, unknown> }) => auditFieldFindingService.update(executionId, findingId, payload), onSuccess: invalidate }),
    cancel: useMutation({ mutationFn: ({ executionId, findingId, reason }: { executionId: string; findingId: string; reason: string }) => auditFieldFindingService.cancel(executionId, findingId, reason), onSuccess: invalidate }),
    convert: useMutation({ mutationFn: ({ executionId, findingId, payload }: { executionId: string; findingId: string; payload: Record<string, unknown> }) => auditFieldFindingService.convert(executionId, findingId, payload), onSuccess: invalidate }),
  };
}
