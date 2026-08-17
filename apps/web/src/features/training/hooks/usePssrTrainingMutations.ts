import { useMutation, useQueryClient } from '@tanstack/react-query';
import { pssrTrainingService } from '../services/pssr-training.service';

function invalidate(queryClient: ReturnType<typeof useQueryClient>) {
  return queryClient.invalidateQueries({ queryKey: ['training', 'pssr'] });
}

export function usePssrTrainingMutations() {
  const queryClient = useQueryClient();
  return {
    create: useMutation({ mutationFn: (payload: Record<string, unknown>) => pssrTrainingService.create(payload), onSuccess: () => invalidate(queryClient) }),
    update: useMutation({ mutationFn: ({ readinessId, payload }: { readinessId: string; payload: Record<string, unknown> }) => pssrTrainingService.update(readinessId, payload), onSuccess: () => invalidate(queryClient) }),
    archive: useMutation({ mutationFn: ({ readinessId, payload }: { readinessId: string; payload?: Record<string, unknown> }) => pssrTrainingService.archive(readinessId, payload), onSuccess: () => invalidate(queryClient) }),
    activate: useMutation({ mutationFn: ({ readinessId, payload }: { readinessId: string; payload?: Record<string, unknown> }) => pssrTrainingService.activate(readinessId, payload), onSuccess: () => invalidate(queryClient) }),
    runImpactCheck: useMutation({ mutationFn: ({ readinessId, payload }: { readinessId: string; payload?: Record<string, unknown> }) => pssrTrainingService.runImpactCheck(readinessId, payload), onSuccess: () => invalidate(queryClient) }),
    generateAssignments: useMutation({ mutationFn: ({ readinessId, payload }: { readinessId: string; payload?: Record<string, unknown> }) => pssrTrainingService.generateAssignments(readinessId, payload), onSuccess: () => invalidate(queryClient) }),
    runReadiness: useMutation({ mutationFn: ({ readinessId, payload }: { readinessId: string; payload?: Record<string, unknown> }) => pssrTrainingService.runReadiness(readinessId, payload), onSuccess: () => invalidate(queryClient) }),
    resolveBlocker: useMutation({ mutationFn: ({ blockerId, payload }: { blockerId: string; payload?: Record<string, unknown> }) => pssrTrainingService.resolveBlocker(blockerId, payload), onSuccess: () => invalidate(queryClient) }),
    verifyBlocker: useMutation({ mutationFn: ({ blockerId, payload }: { blockerId: string; payload?: Record<string, unknown> }) => pssrTrainingService.verifyBlocker(blockerId, payload), onSuccess: () => invalidate(queryClient) }),
    requestWaiver: useMutation({ mutationFn: ({ blockerId, payload }: { blockerId: string; payload: Record<string, unknown> }) => pssrTrainingService.requestWaiver(blockerId, payload), onSuccess: () => invalidate(queryClient) })
  };
}

