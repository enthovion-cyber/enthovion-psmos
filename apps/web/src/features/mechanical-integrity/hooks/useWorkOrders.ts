import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { workOrderService } from '../services/work-order.service';

export function useWorkOrders(filters: Record<string, unknown> = {}) {
  return useQuery({ queryKey: ['mechanical-integrity', 'work-orders', filters], queryFn: () => workOrderService.registry(filters) });
}

export function useWorkOrderLookups() {
  return useQuery({ queryKey: ['mechanical-integrity', 'work-orders', 'lookups'], queryFn: () => workOrderService.lookups() });
}

export function useWorkOrderDetail(id?: string) {
  return useQuery({ queryKey: ['mechanical-integrity', 'work-orders', id], queryFn: () => workOrderService.get(id as string), enabled: Boolean(id) });
}

export function useWorkOrderMutations(id?: string) {
  const queryClient = useQueryClient();
  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ['mechanical-integrity', 'work-orders'] });
    if (id) void queryClient.invalidateQueries({ queryKey: ['mechanical-integrity', 'work-orders', id] });
  };
  return {
    create: useMutation({ mutationFn: workOrderService.create, onSuccess: invalidate }),
    update: useMutation({ mutationFn: (input: Record<string, unknown>) => workOrderService.update(id as string, input), onSuccess: invalidate }),
    submit: useMutation({ mutationFn: (input: Record<string, unknown> = {}) => workOrderService.submit(id as string, input), onSuccess: invalidate }),
    approve: useMutation({ mutationFn: (input: Record<string, unknown> = {}) => workOrderService.approve(id as string, input), onSuccess: invalidate }),
    reject: useMutation({ mutationFn: (input: Record<string, unknown>) => workOrderService.reject(id as string, input), onSuccess: invalidate }),
    plan: useMutation({ mutationFn: (input: Record<string, unknown>) => workOrderService.plan(id as string, input), onSuccess: invalidate }),
    assign: useMutation({ mutationFn: (input: Record<string, unknown>) => workOrderService.assign(id as string, input), onSuccess: invalidate }),
    start: useMutation({ mutationFn: (input: Record<string, unknown> = {}) => workOrderService.start(id as string, input), onSuccess: invalidate }),
    hold: useMutation({ mutationFn: (input: Record<string, unknown>) => workOrderService.hold(id as string, input), onSuccess: invalidate }),
    resume: useMutation({ mutationFn: (input: Record<string, unknown> = {}) => workOrderService.resume(id as string, input), onSuccess: invalidate }),
    complete: useMutation({ mutationFn: (input: Record<string, unknown>) => workOrderService.complete(id as string, input), onSuccess: invalidate }),
    verify: useMutation({ mutationFn: (input: Record<string, unknown>) => workOrderService.verify(id as string, input), onSuccess: invalidate }),
    close: useMutation({ mutationFn: (input: Record<string, unknown> = {}) => workOrderService.close(id as string, input), onSuccess: invalidate }),
    cancel: useMutation({ mutationFn: (input: Record<string, unknown>) => workOrderService.cancel(id as string, input), onSuccess: invalidate }),
    importRows: useMutation({ mutationFn: workOrderService.importRows, onSuccess: invalidate })
  };
}
