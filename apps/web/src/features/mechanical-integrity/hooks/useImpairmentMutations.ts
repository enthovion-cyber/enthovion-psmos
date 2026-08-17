import { useMutation, useQueryClient } from '@tanstack/react-query';
import { impairmentService } from '../services/impairment.service';

export function useImpairmentMutations(impairmentId?: string) {
  const client = useQueryClient();
  const invalidate = () => client.invalidateQueries({ queryKey: ['mechanical-integrity'] });
  return {
    create: useMutation({ mutationFn: (input: Record<string, unknown>) => impairmentService.create(input), onSuccess: invalidate }),
    update: useMutation({ mutationFn: (input: Record<string, unknown>) => impairmentService.update(impairmentId!, input), onSuccess: invalidate }),
    submit: useMutation({ mutationFn: (input: Record<string, unknown> = {}) => impairmentService.submit(impairmentId!, input), onSuccess: invalidate }),
    approve: useMutation({ mutationFn: (input: Record<string, unknown> = {}) => impairmentService.approve(impairmentId!, input), onSuccess: invalidate }),
    reject: useMutation({ mutationFn: (input: Record<string, unknown>) => impairmentService.reject(impairmentId!, input), onSuccess: invalidate }),
    activate: useMutation({ mutationFn: (input: Record<string, unknown> = {}) => impairmentService.activate(impairmentId!, input), onSuccess: invalidate }),
    requestExtension: useMutation({ mutationFn: (input: Record<string, unknown>) => impairmentService.requestExtension(impairmentId!, input), onSuccess: invalidate }),
    restore: useMutation({ mutationFn: (input: Record<string, unknown>) => impairmentService.restore(impairmentId!, input), onSuccess: invalidate }),
    verifyRestoration: useMutation({ mutationFn: (input: Record<string, unknown>) => impairmentService.verifyRestoration(impairmentId!, input), onSuccess: invalidate }),
    close: useMutation({ mutationFn: (input: Record<string, unknown> = {}) => impairmentService.close(impairmentId!, input), onSuccess: invalidate }),
    cancel: useMutation({ mutationFn: (input: Record<string, unknown>) => impairmentService.cancel(impairmentId!, input), onSuccess: invalidate }),
    addLinkedRecord: useMutation({ mutationFn: (input: Record<string, unknown>) => impairmentService.addLinkedRecord(impairmentId!, input), onSuccess: invalidate })
  };
}
