import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { sopAckService } from '../services/sop-acknowledgement.service';

export function useSopAckWaivers(filters: Record<string, unknown> = {}) {
  return useQuery({ queryKey: ['training', 'sop-ack', 'waivers', filters], queryFn: () => sopAckService.waivers(filters) });
}

export function useSopAckWaiverMutations() {
  const client = useQueryClient();
  const invalidate = () => client.invalidateQueries({ queryKey: ['training', 'sop-ack'] });
  return {
    request: useMutation({ mutationFn: ({ assignmentId, payload }: { assignmentId: string; payload: Record<string, unknown> }) => sopAckService.waiverRequest(assignmentId, payload), onSuccess: invalidate }),
    decide: useMutation({ mutationFn: ({ waiverId, decision, payload }: { waiverId: string; decision: 'approve' | 'reject' | 'revoke'; payload?: Record<string, unknown> }) => sopAckService.decideWaiver(waiverId, decision, payload), onSuccess: invalidate })
  };
}
