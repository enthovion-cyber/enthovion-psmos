import { useMutation, useQueryClient } from '@tanstack/react-query';
import { sopAckService } from '../services/sop-acknowledgement.service';

export function useSopAcknowledgementMutations(id?: string) {
  const client = useQueryClient();
  const invalidate = () => client.invalidateQueries({ queryKey: ['training', 'sop-ack'] });
  return {
    acknowledge: useMutation({ mutationFn: ({ assignmentId, payload }: { assignmentId: string; payload: Record<string, unknown> }) => sopAckService.acknowledge(assignmentId, payload), onSuccess: invalidate }),
    verify: useMutation({ mutationFn: (payload?: Record<string, unknown>) => sopAckService.verify(String(id), payload), onSuccess: invalidate }),
    reject: useMutation({ mutationFn: (payload: Record<string, unknown>) => sopAckService.reject(String(id), payload), onSuccess: invalidate }),
    returnForCorrection: useMutation({ mutationFn: (payload: Record<string, unknown>) => sopAckService.returnForCorrection(String(id), payload), onSuccess: invalidate }),
    reopen: useMutation({ mutationFn: (payload: Record<string, unknown>) => sopAckService.reopen(String(id), payload), onSuccess: invalidate })
  };
}
