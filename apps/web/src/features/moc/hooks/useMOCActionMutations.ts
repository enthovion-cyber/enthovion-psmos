'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { MOCActionValues } from '../schemas/moc-actions.schema';
import { mocActionsService } from '../services/moc-actions.service';

export function useMOCActionMutations(id: string) {
  const queryClient = useQueryClient();
  const refresh = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['moc', id] }),
      queryClient.invalidateQueries({ queryKey: ['moc', id, 'detail'] }),
      queryClient.invalidateQueries({ queryKey: ['moc', id, 'closed-loop-actions'] }),
      queryClient.invalidateQueries({ queryKey: ['moc', id, 'engineering-package'] }),
      queryClient.invalidateQueries({ queryKey: ['actions'] }),
      queryClient.invalidateQueries({ queryKey: ['moc'] })
    ]);
  };
  return {
    generate: useMutation({ mutationFn: () => mocActionsService.generate(id), onSuccess: refresh }),
    sync: useMutation({ mutationFn: (source?: string) => mocActionsService.sync(id, source), onSuccess: refresh }),
    createCustom: useMutation({ mutationFn: (values: MOCActionValues) => mocActionsService.createCustom(id, values), onSuccess: refresh }),
    update: useMutation({ mutationFn: ({ actionId, values }: { actionId: string; values: Record<string, any> }) => mocActionsService.update(id, actionId, values), onSuccess: refresh }),
    noLongerRequired: useMutation({ mutationFn: ({ actionId, reason }: { actionId: string; reason: string }) => mocActionsService.noLongerRequired(id, actionId, reason), onSuccess: refresh }),
    createUniversalActions: useMutation({ mutationFn: () => mocActionsService.createUniversalActions(id), onSuccess: refresh }),
    recalculateChecklist: useMutation({ mutationFn: () => mocActionsService.recalculateChecklist(id), onSuccess: refresh })
  };
}
