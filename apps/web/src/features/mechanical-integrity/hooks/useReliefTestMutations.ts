import { useMutation, useQueryClient } from '@tanstack/react-query';
import { reliefTestService } from '../services/relief-test.service';

export function useReliefTestMutations(testId?: string) {
  const client = useQueryClient();
  const invalidate = () => client.invalidateQueries({ queryKey: ['mechanical-integrity'] });
  return {
    create: useMutation({ mutationFn: (input: Record<string, unknown>) => reliefTestService.create(input), onSuccess: invalidate }),
    update: useMutation({ mutationFn: (input: Record<string, unknown>) => reliefTestService.update(testId!, input), onSuccess: invalidate }),
    evaluate: useMutation({ mutationFn: () => reliefTestService.evaluate(testId!), onSuccess: invalidate }),
    submit: useMutation({ mutationFn: (comment?: string) => reliefTestService.submit(testId!, comment), onSuccess: invalidate }),
    approve: useMutation({ mutationFn: (comment?: string) => reliefTestService.approve(testId!, comment), onSuccess: invalidate }),
    reject: useMutation({ mutationFn: (reason: string) => reliefTestService.reject(testId!, reason), onSuccess: invalidate })
  };
}
