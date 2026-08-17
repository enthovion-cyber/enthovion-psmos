import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { sifService } from '../services/sif.service';

export function useSifs(filters: Record<string, unknown> = {}, equipmentId?: string) {
  return useQuery({ queryKey: ['mechanical-integrity', 'sifs', equipmentId ?? 'all', filters], queryFn: () => sifService.registry(filters, equipmentId) });
}

export function useSifDetail(sifId?: string) {
  return useQuery({ queryKey: ['mechanical-integrity', 'sifs', sifId], queryFn: () => sifService.get(sifId as string), enabled: Boolean(sifId) });
}

export function useSifMutations() {
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['mechanical-integrity', 'sifs'] });
  return {
    create: useMutation({ mutationFn: ({ input, equipmentId }: { input: Record<string, unknown>; equipmentId?: string }) => sifService.create(input, equipmentId), onSuccess: invalidate }),
    update: useMutation({ mutationFn: ({ sifId, input }: { sifId: string; input: Record<string, unknown> }) => sifService.update(sifId, input), onSuccess: invalidate }),
    archive: useMutation({ mutationFn: ({ sifId, reason }: { sifId: string; reason: string }) => sifService.archive(sifId, reason), onSuccess: invalidate }),
    reactivate: useMutation({ mutationFn: ({ sifId, reason }: { sifId: string; reason: string }) => sifService.reactivate(sifId, reason), onSuccess: invalidate }),
    recalculateSchedule: useMutation({ mutationFn: (sifId: string) => sifService.recalculateSchedule(sifId), onSuccess: invalidate })
  };
}
