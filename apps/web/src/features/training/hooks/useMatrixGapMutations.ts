import { useMutation, useQueryClient } from '@tanstack/react-query';
import { trainingMatrixGapService } from '../services/training-matrix-gap.service';

export function useMatrixGapMutations(gapId?: string) {
  const qc = useQueryClient();
  const done = () => qc.invalidateQueries({ queryKey: ['training-matrix-gaps'] });
  return {
    assign: useMutation({ mutationFn: (data: Record<string, unknown>) => trainingMatrixGapService.assign(gapId ?? '', data), onSuccess: done }),
    createAction: useMutation({ mutationFn: (data: Record<string, unknown>) => trainingMatrixGapService.createAction(gapId ?? '', data), onSuccess: done }),
    markResolved: useMutation({ mutationFn: (data: Record<string, unknown>) => trainingMatrixGapService.markResolved(gapId ?? '', data), onSuccess: done }),
    verify: useMutation({ mutationFn: (data: Record<string, unknown>) => trainingMatrixGapService.verify(gapId ?? '', data), onSuccess: done }),
    reopen: useMutation({ mutationFn: (data: Record<string, unknown>) => trainingMatrixGapService.reopen(gapId ?? '', data), onSuccess: done })
  };
}
