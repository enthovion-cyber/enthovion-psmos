import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { workforceService } from '../services/workforce.service';

export function useWorkerMutations(workerId?: string) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['training'] });
    if (workerId) queryClient.invalidateQueries({ queryKey: ['training', 'worker', workerId] });
  };
  const workerPath = (data: Record<string, any>) => {
    const id = data?.worker?.id ?? data?.id ?? data?.data?.worker?.id ?? data?.data?.id;
    return id ? `/training-competency/workforce/${id}` : '/training-competency/workforce';
  };
  return {
    create: useMutation({ mutationFn: workforceService.create, onSuccess: (data) => { invalidate(); router.push(workerPath(data as Record<string, any>)); } }),
    update: useMutation({ mutationFn: (values: Record<string, any>) => workforceService.update(String(workerId), values), onSuccess: invalidate }),
    archive: useMutation({ mutationFn: (reason: string) => workforceService.archive(String(workerId), reason), onSuccess: invalidate }),
    reactivate: useMutation({ mutationFn: (reason?: string) => workforceService.reactivate(String(workerId), reason), onSuccess: invalidate }),
    recalculate: useMutation({ mutationFn: () => workforceService.recalculateStatus(String(workerId)), onSuccess: invalidate })
  };
}
