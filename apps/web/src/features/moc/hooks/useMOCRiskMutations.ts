'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { MOCRiskValues } from '../schemas/moc-risk.schema';
import { mocRiskService } from '../services/moc-risk.service';

export function useMOCRiskMutations(id: string) {
  const queryClient = useQueryClient();
  const refresh = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['moc', id] }),
      queryClient.invalidateQueries({ queryKey: ['moc', id, 'detail'] }),
      queryClient.invalidateQueries({ queryKey: ['moc', id, 'risk'] }),
      queryClient.invalidateQueries({ queryKey: ['moc', id, 'risk-history'] }),
      queryClient.invalidateQueries({ queryKey: ['moc', id, 'risk-review-requirements'] }),
      queryClient.invalidateQueries({ queryKey: ['moc'] })
    ]);
  };
  return {
    save: useMutation({ mutationFn: (values: MOCRiskValues) => mocRiskService.save(id, values), onSuccess: refresh }),
    recalculate: useMutation({ mutationFn: (values: Partial<MOCRiskValues>) => mocRiskService.recalculate(id, values), onSuccess: refresh }),
    complete: useMutation({ mutationFn: () => mocRiskService.complete(id), onSuccess: refresh }),
    requestReassessment: useMutation({ mutationFn: (reason: string) => mocRiskService.requestReassessment(id, reason), onSuccess: refresh }),
    lock: useMutation({ mutationFn: () => mocRiskService.lock(id), onSuccess: refresh }),
    unlock: useMutation({ mutationFn: () => mocRiskService.unlock(id), onSuccess: refresh }),
    applyReviewRequirements: useMutation({ mutationFn: () => mocRiskService.applyReviewRequirements(id), onSuccess: refresh })
  };
}
