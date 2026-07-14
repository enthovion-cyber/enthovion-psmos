'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { mocWorkflowService } from '../services/moc-workflow.service';

export function useMOCWorkflowMutations(id: string) {
  const queryClient = useQueryClient();
  const refresh = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['moc', id] }),
      queryClient.invalidateQueries({ queryKey: ['moc', id, 'workflow'] }),
      queryClient.invalidateQueries({ queryKey: ['moc', id, 'history'] }),
      queryClient.invalidateQueries({ queryKey: ['moc'] }),
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    ]);
  };
  return {
    start: useMutation({ mutationFn: () => mocWorkflowService.start(id), onSuccess: refresh }),
    approve: useMutation({ mutationFn: (values: Record<string, any>) => mocWorkflowService.approve(id, values), onSuccess: refresh }),
    reject: useMutation({ mutationFn: (values: Record<string, any>) => mocWorkflowService.reject(id, values), onSuccess: refresh }),
    returnForRevision: useMutation({ mutationFn: (values: Record<string, any>) => mocWorkflowService.returnForRevision(id, values), onSuccess: refresh }),
    delegate: useMutation({ mutationFn: (values: Record<string, any>) => mocWorkflowService.delegate(id, values), onSuccess: refresh }),
    escalate: useMutation({ mutationFn: () => mocWorkflowService.escalate(id), onSuccess: refresh }),
    restart: useMutation({ mutationFn: (values: Record<string, any>) => mocWorkflowService.restart(id, values), onSuccess: refresh })
  };
}
