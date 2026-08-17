import { useMutation, useQueryClient } from '@tanstack/react-query';
import { reliefSchedulerService } from '../services/relief-scheduler.service';

export function useReliefScheduler() {
  const client = useQueryClient();
  return useMutation({ mutationFn: () => reliefSchedulerService.run(), onSuccess: () => client.invalidateQueries({ queryKey: ['mechanical-integrity'] }) });
}
