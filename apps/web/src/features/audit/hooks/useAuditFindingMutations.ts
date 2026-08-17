import { useMutation, useQueryClient } from "@tanstack/react-query";
import { auditFindingService } from "../services/audit-finding.service";

export function useAuditFindingMutations(findingId?: string) {
  const client = useQueryClient();
  const invalidate = async () => {
    await client.invalidateQueries({ queryKey: ["audit", "findings"] });
  };
  return {
    create: useMutation({ mutationFn: (payload: Record<string, unknown>) => auditFindingService.create(payload), onSuccess: invalidate }),
    update: useMutation({ mutationFn: (payload: Record<string, unknown>) => auditFindingService.update(String(findingId), payload), onSuccess: invalidate }),
    action: useMutation({ mutationFn: ({ action, payload }: { action: string; payload?: Record<string, unknown> }) => auditFindingService.action(String(findingId), action, payload ?? {}), onSuccess: invalidate }),
    section: useMutation({ mutationFn: ({ section, payload }: { section: string; payload: Record<string, unknown> }) => auditFindingService.addSection(String(findingId), section, payload), onSuccess: invalidate }),
    convert: useMutation({ mutationFn: ({ executionId, fieldFindingId, payload }: { executionId: string; fieldFindingId: string; payload: Record<string, unknown> }) => auditFindingService.convertFieldFinding(executionId, fieldFindingId, payload), onSuccess: invalidate }),
    checkDuplicates: useMutation({ mutationFn: (payload: Record<string, unknown> = {}) => auditFindingService.checkDuplicates(String(findingId), payload), onSuccess: invalidate }),
    calculateReadiness: useMutation({ mutationFn: () => auditFindingService.calculateReadiness(String(findingId)), onSuccess: invalidate }),
  };
}
