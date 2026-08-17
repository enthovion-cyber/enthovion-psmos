import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { deficiencyService } from '../services/deficiency.service';

export function useDeficiencies(filters: Record<string, unknown> = {}) {
  return useQuery({ queryKey: ['mechanical-integrity', 'deficiencies', filters], queryFn: () => deficiencyService.registry(filters) });
}

export function useDeficiencyLookups() {
  return useQuery({ queryKey: ['mechanical-integrity', 'deficiencies', 'lookups'], queryFn: () => deficiencyService.lookups() });
}

export function useDeficiencyDetail(id?: string) {
  return useQuery({ queryKey: ['mechanical-integrity', 'deficiencies', id], queryFn: () => deficiencyService.get(id as string), enabled: Boolean(id) });
}

export function useDeficiencyMutations(id?: string) {
  const queryClient = useQueryClient();
  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ['mechanical-integrity', 'deficiencies'] });
    if (id) void queryClient.invalidateQueries({ queryKey: ['mechanical-integrity', 'deficiencies', id] });
  };
  return {
    create: useMutation({ mutationFn: deficiencyService.create, onSuccess: invalidate }),
    update: useMutation({ mutationFn: (input: Record<string, unknown>) => deficiencyService.update(id as string, input), onSuccess: invalidate }),
    submit: useMutation({ mutationFn: (input: Record<string, unknown> = {}) => deficiencyService.submit(id as string, input), onSuccess: invalidate }),
    review: useMutation({ mutationFn: (input: Record<string, unknown> = {}) => deficiencyService.review(id as string, input), onSuccess: invalidate }),
    approve: useMutation({ mutationFn: (input: Record<string, unknown> = {}) => deficiencyService.approve(id as string, input), onSuccess: invalidate }),
    reject: useMutation({ mutationFn: (input: Record<string, unknown>) => deficiencyService.reject(id as string, input), onSuccess: invalidate }),
    verify: useMutation({ mutationFn: (input: Record<string, unknown>) => deficiencyService.verify(id as string, input), onSuccess: invalidate }),
    close: useMutation({ mutationFn: (input: Record<string, unknown> = {}) => deficiencyService.close(id as string, input), onSuccess: invalidate }),
    cancel: useMutation({ mutationFn: (input: Record<string, unknown>) => deficiencyService.cancel(id as string, input), onSuccess: invalidate })
  };
}
