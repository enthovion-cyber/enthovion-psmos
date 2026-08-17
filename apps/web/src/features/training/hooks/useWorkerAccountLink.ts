import { useMutation, useQueryClient } from '@tanstack/react-query';
import { workerAccountLinkService } from '../services/worker-account-link.service';

export function useWorkerAccountLink(workerId: string) {
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['training', 'worker', workerId] });
  return {
    link: useMutation({ mutationFn: (values: Record<string, any>) => workerAccountLinkService.link(workerId, values), onSuccess: invalidate }),
    invite: useMutation({ mutationFn: (values: Record<string, any>) => workerAccountLinkService.invite(workerId, values), onSuccess: invalidate })
  };
}
