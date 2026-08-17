import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { deviationService } from '../services/deviation.service';

export function useDeviations(filters: Record<string, unknown> = {}) {
  return useQuery({ queryKey: ['mechanical-integrity', 'deviations', filters], queryFn: () => deviationService.registry(filters) });
}

export function useDeviationDetail(id?: string) {
  return useQuery({ queryKey: ['mechanical-integrity', 'deviations', id], queryFn: () => deviationService.get(id as string), enabled: Boolean(id) });
}

export function useDeviationMutations(id?: string) {
  const queryClient = useQueryClient();
  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ['mechanical-integrity', 'deviations'] });
    if (id) void queryClient.invalidateQueries({ queryKey: ['mechanical-integrity', 'deviations', id] });
  };
  return {
    create: useMutation({ mutationFn: deviationService.create, onSuccess: invalidate }),
    update: useMutation({ mutationFn: (input: Record<string, unknown>) => deviationService.update(id as string, input), onSuccess: invalidate }),
    submit: useMutation({ mutationFn: (input: Record<string, unknown> = {}) => deviationService.submit(id as string, input), onSuccess: invalidate }),
    approve: useMutation({ mutationFn: (input: Record<string, unknown> = {}) => deviationService.approve(id as string, input), onSuccess: invalidate }),
    reject: useMutation({ mutationFn: (input: Record<string, unknown>) => deviationService.reject(id as string, input), onSuccess: invalidate }),
    requestExtension: useMutation({ mutationFn: (input: Record<string, unknown>) => deviationService.requestExtension(id as string, input), onSuccess: invalidate }),
    approveExtension: useMutation({ mutationFn: (input: Record<string, unknown>) => deviationService.approveExtension(id as string, input), onSuccess: invalidate }),
    close: useMutation({ mutationFn: (input: Record<string, unknown>) => deviationService.close(id as string, input), onSuccess: invalidate })
  };
}
