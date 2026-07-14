import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { BriefingValues, WorkerValues } from '../schemas/workforce.schema';
import { ptwWorkforceService } from '../services/ptw-workforce.service';

export function usePermitWorkforceMutations(permitId: string) {
  const queryClient = useQueryClient();
  const invalidate = () => Promise.all([
    queryClient.invalidateQueries({ queryKey: ['ptw'] }),
    queryClient.invalidateQueries({ queryKey: ['ptw', permitId] }),
    queryClient.invalidateQueries({ queryKey: ['ptw', permitId, 'summary'] }),
    queryClient.invalidateQueries({ queryKey: ['ptw', permitId, 'history'] }),
    queryClient.invalidateQueries({ queryKey: ['ptw', permitId, 'workforce'] }),
    queryClient.invalidateQueries({ queryKey: ['ptw', permitId, 'briefings'] })
  ]);

  return {
    create: useMutation({ mutationFn: (input: WorkerValues) => ptwWorkforceService.create(permitId, input), onSuccess: invalidate }),
    update: useMutation({ mutationFn: ({ id, input }: { id: string; input: Partial<WorkerValues> }) => ptwWorkforceService.update(permitId, id, input), onSuccess: invalidate }),
    remove: useMutation({ mutationFn: (id: string) => ptwWorkforceService.remove(permitId, id), onSuccess: invalidate }),
    completeBriefing: useMutation({ mutationFn: (id: string) => ptwWorkforceService.completeBriefing(permitId, id), onSuccess: invalidate }),
    signIn: useMutation({ mutationFn: (id: string) => ptwWorkforceService.signIn(permitId, id), onSuccess: invalidate }),
    signOut: useMutation({ mutationFn: (id: string) => ptwWorkforceService.signOut(permitId, id), onSuccess: invalidate }),
    bulkBriefing: useMutation({ mutationFn: (ids?: string[]) => ptwWorkforceService.bulkBriefing(permitId, ids), onSuccess: invalidate }),
    bulkSignIn: useMutation({ mutationFn: (ids?: string[]) => ptwWorkforceService.bulkSignIn(permitId, ids), onSuccess: invalidate }),
    bulkSignOut: useMutation({ mutationFn: (ids?: string[]) => ptwWorkforceService.bulkSignOut(permitId, ids), onSuccess: invalidate }),
    createBriefing: useMutation({ mutationFn: (input: BriefingValues) => ptwWorkforceService.createBriefing(permitId, input), onSuccess: invalidate }),
    updateBriefing: useMutation({ mutationFn: ({ id, input }: { id: string; input: BriefingValues }) => ptwWorkforceService.updateBriefing(permitId, id, input), onSuccess: invalidate }),
    accountabilityCheck: useMutation({ mutationFn: (notes?: string) => ptwWorkforceService.accountabilityCheck(permitId, notes), onSuccess: invalidate })
  };
}
