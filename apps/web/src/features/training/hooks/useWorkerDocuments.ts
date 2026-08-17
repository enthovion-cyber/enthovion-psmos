import { useMutation, useQueryClient } from '@tanstack/react-query';
import { workforceService } from '../services/workforce.service';

export function useWorkerDocuments(workerId: string) {
  const queryClient = useQueryClient();
  return {
    link: useMutation({
      mutationFn: (values: Record<string, any>) => workforceService.linkDocument(workerId, values),
      onSuccess: () => queryClient.invalidateQueries({ queryKey: ['training', 'worker', workerId] })
    })
  };
}
