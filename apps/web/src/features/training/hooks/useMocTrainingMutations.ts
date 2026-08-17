import { useMutation, useQueryClient } from '@tanstack/react-query';
import { mocTrainingService } from '../services/moc-training.service';

function invalidate(queryClient: ReturnType<typeof useQueryClient>) {
  return queryClient.invalidateQueries({ queryKey: ['training', 'moc'] });
}

export function useMocTrainingMutations() {
  const queryClient = useQueryClient();
  return {
    create: useMutation({ mutationFn: (payload: Record<string, unknown>) => mocTrainingService.create(payload), onSuccess: () => invalidate(queryClient) }),
    update: useMutation({ mutationFn: ({ requirementId, payload }: { requirementId: string; payload: Record<string, unknown> }) => mocTrainingService.update(requirementId, payload), onSuccess: () => invalidate(queryClient) }),
    archive: useMutation({ mutationFn: ({ requirementId, payload }: { requirementId: string; payload?: Record<string, unknown> }) => mocTrainingService.archive(requirementId, payload), onSuccess: () => invalidate(queryClient) }),
    activate: useMutation({ mutationFn: ({ requirementId, payload }: { requirementId: string; payload?: Record<string, unknown> }) => mocTrainingService.activate(requirementId, payload), onSuccess: () => invalidate(queryClient) }),
    runImpactCheck: useMutation({ mutationFn: ({ requirementId, payload }: { requirementId: string; payload?: Record<string, unknown> }) => mocTrainingService.runImpactCheck(requirementId, payload), onSuccess: () => invalidate(queryClient) }),
    generateAssignments: useMutation({ mutationFn: ({ requirementId, payload }: { requirementId: string; payload?: Record<string, unknown> }) => mocTrainingService.generateAssignments(requirementId, payload), onSuccess: () => invalidate(queryClient) }),
    runReadiness: useMutation({ mutationFn: ({ requirementId, payload }: { requirementId: string; payload?: Record<string, unknown> }) => mocTrainingService.runReadiness(requirementId, payload), onSuccess: () => invalidate(queryClient) }),
    resolveBlocker: useMutation({ mutationFn: ({ blockerId, payload }: { blockerId: string; payload?: Record<string, unknown> }) => mocTrainingService.resolveBlocker(blockerId, payload), onSuccess: () => invalidate(queryClient) }),
    verifyBlocker: useMutation({ mutationFn: ({ blockerId, payload }: { blockerId: string; payload?: Record<string, unknown> }) => mocTrainingService.verifyBlocker(blockerId, payload), onSuccess: () => invalidate(queryClient) }),
    requestWaiver: useMutation({ mutationFn: ({ blockerId, payload }: { blockerId: string; payload: Record<string, unknown> }) => mocTrainingService.requestWaiver(blockerId, payload), onSuccess: () => invalidate(queryClient) })
  };
}
