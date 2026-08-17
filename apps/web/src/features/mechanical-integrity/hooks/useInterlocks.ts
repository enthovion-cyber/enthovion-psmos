import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { interlockService } from '../services/interlock.service';

export function useInterlocks(filters: Record<string, unknown> = {}, equipmentId?: string) {
  return useQuery({ queryKey: ['mechanical-integrity', 'interlocks', equipmentId ?? 'all', filters], queryFn: () => interlockService.registry(filters, equipmentId) });
}

export function useInterlockDetail(interlockId?: string) {
  return useQuery({ queryKey: ['mechanical-integrity', 'interlocks', interlockId], queryFn: () => interlockService.get(interlockId as string), enabled: Boolean(interlockId) });
}

export function useInterlockMutations() {
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['mechanical-integrity', 'interlocks'] });
  return {
    create: useMutation({ mutationFn: (input: Record<string, unknown>) => interlockService.create(input), onSuccess: invalidate }),
    update: useMutation({ mutationFn: ({ interlockId, input }: { interlockId: string; input: Record<string, unknown> }) => interlockService.update(interlockId, input), onSuccess: invalidate }),
    archive: useMutation({ mutationFn: ({ interlockId, reason }: { interlockId: string; reason: string }) => interlockService.archive(interlockId, reason), onSuccess: invalidate }),
    reactivate: useMutation({ mutationFn: ({ interlockId, reason }: { interlockId: string; reason: string }) => interlockService.reactivate(interlockId, reason), onSuccess: invalidate })
  };
}
