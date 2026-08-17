import { useMutation, useQueryClient } from '@tanstack/react-query';
import { psiCompletenessService } from '../services/psi-completeness.service';

export function usePsiGapMutations() {
  const client = useQueryClient();
  const invalidate = () => client.invalidateQueries({ queryKey: ['psi', 'completeness'] });
  return {
    assignGap: useMutation({ mutationFn: ({ gapId, input }: { gapId: string; input: Record<string, unknown> }) => psiCompletenessService.assignGap(gapId, input), onSuccess: invalidate }),
    markResolved: useMutation({ mutationFn: ({ gapId, input }: { gapId: string; input: Record<string, unknown> }) => psiCompletenessService.markResolved(gapId, input), onSuccess: invalidate }),
    verifyGap: useMutation({ mutationFn: ({ gapId, input }: { gapId: string; input: Record<string, unknown> }) => psiCompletenessService.verifyGap(gapId, input), onSuccess: invalidate }),
    reopenGap: useMutation({ mutationFn: ({ gapId, input }: { gapId: string; input: Record<string, unknown> }) => psiCompletenessService.reopenGap(gapId, input), onSuccess: invalidate }),
    createAction: useMutation({ mutationFn: ({ gapId, input }: { gapId: string; input: Record<string, unknown> }) => psiCompletenessService.createAction(gapId, input), onSuccess: invalidate })
  };
}
