import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { psiCompletenessService } from '../services/psi-completeness.service';

export function usePsiWaivers(filters: Record<string, unknown> = {}) {
  return useQuery({ queryKey: ['psi', 'completeness', 'waivers', filters], queryFn: () => psiCompletenessService.waivers(filters) });
}

export function usePsiWaiverMutations() {
  const client = useQueryClient();
  const invalidate = () => client.invalidateQueries({ queryKey: ['psi', 'completeness'] });
  return {
    requestWaiver: useMutation({ mutationFn: (input: Record<string, unknown>) => psiCompletenessService.requestWaiver(input), onSuccess: invalidate }),
    approveWaiver: useMutation({ mutationFn: ({ waiverId, input }: { waiverId: string; input: Record<string, unknown> }) => psiCompletenessService.approveWaiver(waiverId, input), onSuccess: invalidate }),
    rejectWaiver: useMutation({ mutationFn: ({ waiverId, input }: { waiverId: string; input: Record<string, unknown> }) => psiCompletenessService.rejectWaiver(waiverId, input), onSuccess: invalidate }),
    revokeWaiver: useMutation({ mutationFn: ({ waiverId, input }: { waiverId: string; input: Record<string, unknown> }) => psiCompletenessService.revokeWaiver(waiverId, input), onSuccess: invalidate })
  };
}
