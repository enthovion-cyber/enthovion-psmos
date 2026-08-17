import { useMutation, useQueryClient } from '@tanstack/react-query';
import { readinessService } from '../services/readiness.service';

export function useReadinessMutations(id?: string) {
  const queryClient = useQueryClient();
  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ['mechanical-integrity', 'readiness'] });
    if (id) void queryClient.invalidateQueries({ queryKey: ['mechanical-integrity', 'readiness-detail', id] });
  };
  return {
    create: useMutation({ mutationFn: readinessService.create, onSuccess: invalidate }),
    update: useMutation({ mutationFn: (input: Record<string, unknown>) => readinessService.update(id as string, input), onSuccess: invalidate }),
    runCheck: useMutation({ mutationFn: (input: Record<string, unknown> = {}) => readinessService.runCheck(id as string, input), onSuccess: invalidate }),
    submit: useMutation({ mutationFn: (input: Record<string, unknown> = {}) => readinessService.submit(id as string, input), onSuccess: invalidate }),
    review: useMutation({ mutationFn: (input: Record<string, unknown> = {}) => readinessService.review(id as string, input), onSuccess: invalidate }),
    approve: useMutation({ mutationFn: (input: Record<string, unknown> = {}) => readinessService.approve(id as string, input), onSuccess: invalidate }),
    reject: useMutation({ mutationFn: (input: Record<string, unknown>) => readinessService.reject(id as string, input), onSuccess: invalidate }),
    override: useMutation({ mutationFn: (input: Record<string, unknown>) => readinessService.override(id as string, input), onSuccess: invalidate }),
    close: useMutation({ mutationFn: (input: Record<string, unknown> = {}) => readinessService.close(id as string, input), onSuccess: invalidate }),
    addRestriction: useMutation({ mutationFn: (input: Record<string, unknown>) => readinessService.addRestriction(id as string, input), onSuccess: invalidate }),
    updateRestriction: useMutation({ mutationFn: (input: { restrictionId: string; values: Record<string, unknown> }) => readinessService.updateRestriction(id as string, input.restrictionId, input.values), onSuccess: invalidate }),
    waiveBlocker: useMutation({ mutationFn: (input: { blockerId: string; reason: string }) => readinessService.waiveBlocker(id as string, input.blockerId, { reason: input.reason }), onSuccess: invalidate }),
    clearBlocker: useMutation({ mutationFn: (input: { blockerId: string; reason?: string }) => readinessService.clearBlocker(id as string, input.blockerId, { reason: input.reason ?? null }), onSuccess: invalidate }),
    createActionFromBlocker: useMutation({ mutationFn: (input: { blockerId: string; values: Record<string, unknown> }) => readinessService.createActionFromBlocker(id as string, input.blockerId, input.values), onSuccess: invalidate }),
    addLinkedRecord: useMutation({ mutationFn: (input: Record<string, unknown>) => readinessService.addLinkedRecord(id as string, input), onSuccess: invalidate }),
    removeLinkedRecord: useMutation({ mutationFn: (linkId: string) => readinessService.removeLinkedRecord(id as string, linkId), onSuccess: invalidate })
  };
}
