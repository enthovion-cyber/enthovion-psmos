import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { safeguardDemandService } from '../services/safeguard-demand.service';

export function useSafeguardDemands(safeguardType?: string, safeguardId?: string, filters: Record<string, unknown> = {}) {
  return useQuery({
    queryKey: ['mechanical-integrity', 'safeguard-demands', safeguardType, safeguardId, filters],
    queryFn: () => safeguardDemandService.registry(safeguardType as string, safeguardId as string, filters),
    enabled: Boolean(safeguardType && safeguardId)
  });
}

export function useSafeguardDemandMutations() {
  const queryClient = useQueryClient();
  return {
    create: useMutation({
      mutationFn: ({ safeguardType, safeguardId, input }: { safeguardType: string; safeguardId: string; input: Record<string, unknown> }) => safeguardDemandService.create(safeguardType, safeguardId, input),
      onSuccess: () => queryClient.invalidateQueries({ queryKey: ['mechanical-integrity', 'safeguard-demands'] })
    }),
    update: useMutation({
      mutationFn: ({ safeguardType, safeguardId, demandId, input }: { safeguardType: string; safeguardId: string; demandId: string; input: Record<string, unknown> }) => safeguardDemandService.update(safeguardType, safeguardId, demandId, input),
      onSuccess: () => queryClient.invalidateQueries({ queryKey: ['mechanical-integrity', 'safeguard-demands'] })
    })
  };
}
