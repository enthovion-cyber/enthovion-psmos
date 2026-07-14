'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { mocStartupService } from '../services/moc-startup.service';

export function useMOCStartupMutations(id: string) {
  const queryClient = useQueryClient();
  const refresh = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['moc', id] }),
      queryClient.invalidateQueries({ queryKey: ['moc', id, 'pssr-startup'] }),
      queryClient.invalidateQueries({ queryKey: ['moc', id, 'closed-loop-actions'] }),
      queryClient.invalidateQueries({ queryKey: ['moc', id, 'workflow'] }),
      queryClient.invalidateQueries({ queryKey: ['moc', id, 'history'] }),
      queryClient.invalidateQueries({ queryKey: ['moc'] }),
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    ]);
  };
  return {
    runCheck: useMutation({ mutationFn: () => mocStartupService.runCheck(id), onSuccess: refresh }),
    triggerPssr: useMutation({ mutationFn: (values: Record<string, any>) => mocStartupService.triggerPssr(id, values), onSuccess: refresh }),
    syncPssr: useMutation({ mutationFn: (values: Record<string, any>) => mocStartupService.syncPssr(id, values), onSuccess: refresh }),
    createBlockerAction: useMutation({ mutationFn: (values: Record<string, any>) => mocStartupService.createBlockerAction(id, values), onSuccess: refresh }),
    readyForStartup: useMutation({ mutationFn: (values: Record<string, any>) => mocStartupService.readyForStartup(id, values), onSuccess: refresh }),
    releaseForStartup: useMutation({ mutationFn: (values: Record<string, any>) => mocStartupService.releaseForStartup(id, values), onSuccess: refresh }),
    returnToImplementation: useMutation({ mutationFn: (values: Record<string, any>) => mocStartupService.returnToImplementation(id, values), onSuccess: refresh })
  };
}
