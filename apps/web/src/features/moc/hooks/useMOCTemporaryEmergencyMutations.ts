'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { mocTemporaryEmergencyService } from '../services/moc-temporary-emergency.service';

export function useMOCTemporaryEmergencyMutations(id: string) {
  const queryClient = useQueryClient();
  const refresh = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['moc', id] }),
      queryClient.invalidateQueries({ queryKey: ['moc', id, 'temporary-control'] }),
      queryClient.invalidateQueries({ queryKey: ['moc', id, 'emergency-control'] }),
      queryClient.invalidateQueries({ queryKey: ['moc', id, 'pssr-startup'] }),
      queryClient.invalidateQueries({ queryKey: ['moc', id, 'closed-loop-actions'] }),
      queryClient.invalidateQueries({ queryKey: ['moc', id, 'history'] }),
      queryClient.invalidateQueries({ queryKey: ['moc'] }),
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    ]);
  };
  return {
    updateTemporary: useMutation({ mutationFn: (values: Record<string, any>) => mocTemporaryEmergencyService.updateTemporary(id, values), onSuccess: refresh }),
    requestExtension: useMutation({ mutationFn: (values: Record<string, any>) => mocTemporaryEmergencyService.requestExtension(id, values), onSuccess: refresh }),
    approveExtension: useMutation({ mutationFn: (values: Record<string, any>) => mocTemporaryEmergencyService.approveExtension(id, values), onSuccess: refresh }),
    rejectExtension: useMutation({ mutationFn: (values: Record<string, any>) => mocTemporaryEmergencyService.rejectExtension(id, values), onSuccess: refresh }),
    markRemovalComplete: useMutation({ mutationFn: (values: Record<string, any>) => mocTemporaryEmergencyService.markRemovalComplete(id, values), onSuccess: refresh }),
    convertTemporaryToPermanent: useMutation({ mutationFn: (values: Record<string, any>) => mocTemporaryEmergencyService.convertTemporaryToPermanent(id, values), onSuccess: refresh }),
    updateEmergency: useMutation({ mutationFn: (values: Record<string, any>) => mocTemporaryEmergencyService.updateEmergency(id, values), onSuccess: refresh }),
    completeEmergencyReview: useMutation({ mutationFn: (values: Record<string, any>) => mocTemporaryEmergencyService.completeEmergencyReview(id, values), onSuccess: refresh }),
    createEmergencyFollowupAction: useMutation({ mutationFn: (values: Record<string, any>) => mocTemporaryEmergencyService.createEmergencyFollowupAction(id, values), onSuccess: refresh }),
    convertEmergencyToPermanent: useMutation({ mutationFn: (values: Record<string, any>) => mocTemporaryEmergencyService.convertEmergencyToPermanent(id, values), onSuccess: refresh })
  };
}
