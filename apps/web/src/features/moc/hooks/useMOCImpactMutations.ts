'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { MOCImpactValues } from '../schemas/moc-impact.schema';
import { mocImpactService } from '../services/moc-impact.service';

export function useMOCImpactMutations(id: string) {
  const queryClient = useQueryClient();
  const refresh = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['moc', id] }),
      queryClient.invalidateQueries({ queryKey: ['moc', id, 'detail'] }),
      queryClient.invalidateQueries({ queryKey: ['moc', id, 'impact-assessment'] }),
      queryClient.invalidateQueries({ queryKey: ['moc', id, 'impact-generated-actions'] }),
      queryClient.invalidateQueries({ queryKey: ['moc', id, 'startup-blockers'] }),
      queryClient.invalidateQueries({ queryKey: ['moc', id, 'closure-blockers'] }),
      queryClient.invalidateQueries({ queryKey: ['moc'] })
    ]);
  };
  return {
    save: useMutation({ mutationFn: (values: MOCImpactValues) => mocImpactService.saveAnswers(id, values), onSuccess: refresh }),
    complete: useMutation({ mutationFn: () => mocImpactService.complete(id), onSuccess: refresh }),
    regenerate: useMutation({ mutationFn: () => mocImpactService.regenerateActions(id), onSuccess: refresh }),
    apply: useMutation({ mutationFn: () => mocImpactService.applyGeneratedActions(id), onSuccess: refresh })
  };
}
