import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { safeguardTestService } from '../services/safeguard-test.service';

export function useSafeguardTests(filters: Record<string, unknown> = {}, equipmentId?: string) {
  return useQuery({ queryKey: ['mechanical-integrity', 'safeguard-tests', equipmentId ?? 'all', filters], queryFn: () => safeguardTestService.registry(filters, equipmentId) });
}

export function useSafeguardTestDetail(testId?: string) {
  return useQuery({ queryKey: ['mechanical-integrity', 'safeguard-tests', testId], queryFn: () => safeguardTestService.get(testId as string), enabled: Boolean(testId) });
}

export function useSafeguardTestMutations() {
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['mechanical-integrity', 'safeguard-tests'] });
  return {
    create: useMutation({ mutationFn: (input: Record<string, unknown>) => safeguardTestService.create(input), onSuccess: invalidate }),
    update: useMutation({ mutationFn: ({ testId, input }: { testId: string; input: Record<string, unknown> }) => safeguardTestService.update(testId, input), onSuccess: invalidate }),
    evaluate: useMutation({ mutationFn: (testId: string) => safeguardTestService.evaluate(testId), onSuccess: invalidate }),
    submit: useMutation({ mutationFn: ({ testId, input }: { testId: string; input: Record<string, unknown> }) => safeguardTestService.submit(testId, input), onSuccess: invalidate }),
    approve: useMutation({ mutationFn: ({ testId, input }: { testId: string; input: Record<string, unknown> }) => safeguardTestService.approve(testId, input), onSuccess: invalidate }),
    reject: useMutation({ mutationFn: ({ testId, input }: { testId: string; input: Record<string, unknown> }) => safeguardTestService.reject(testId, input), onSuccess: invalidate })
  };
}
