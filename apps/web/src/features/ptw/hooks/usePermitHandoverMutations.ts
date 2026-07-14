import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { HandoverValues } from '../schemas/handover.schema';
import { ptwHandoverService } from '../services/ptw-handover.service';

export function usePermitHandoverMutations(permitId: string) {
  const queryClient = useQueryClient();
  const invalidate = () => Promise.all([
    queryClient.invalidateQueries({ queryKey: ['ptw'] }),
    queryClient.invalidateQueries({ queryKey: ['ptw', permitId] }),
    queryClient.invalidateQueries({ queryKey: ['ptw', permitId, 'summary'] }),
    queryClient.invalidateQueries({ queryKey: ['ptw', permitId, 'handover'] }),
    queryClient.invalidateQueries({ queryKey: ['ptw', permitId, 'history'] })
  ]);

  return {
    create: useMutation({ mutationFn: (input: HandoverValues) => ptwHandoverService.create(permitId, input), onSuccess: invalidate }),
    update: useMutation({ mutationFn: ({ id, input }: { id: string; input: HandoverValues }) => ptwHandoverService.update(permitId, id, input), onSuccess: invalidate }),
    remove: useMutation({ mutationFn: (id: string) => ptwHandoverService.remove(permitId, id), onSuccess: invalidate }),
    checklist: useMutation({ mutationFn: ({ handoverId, itemId, isChecked, notes }: { handoverId: string; itemId: string; isChecked: boolean; notes?: string | undefined }) => ptwHandoverService.checklist(permitId, handoverId, itemId, isChecked, notes), onSuccess: invalidate }),
    acknowledge: useMutation({ mutationFn: ({ id, signature, comments }: { id: string; signature: string; comments?: string | undefined }) => ptwHandoverService.acknowledge(permitId, id, signature, comments), onSuccess: invalidate }),
    complete: useMutation({ mutationFn: (id: string) => ptwHandoverService.complete(permitId, id), onSuccess: invalidate }),
    suspend: useMutation({ mutationFn: ({ id, reason }: { id: string; reason: string }) => ptwHandoverService.suspend(permitId, id, reason), onSuccess: invalidate })
  };
}
