import { useQuery } from '@tanstack/react-query';
import { sopAckService } from '../services/sop-acknowledgement.service';

export function useWorkerSopAcknowledgements(workerId: string, filters: Record<string, unknown> = {}) {
  const view = typeof filters.view === 'string' ? filters.view : '';
  const nextFilters = { ...filters };
  delete nextFilters.view;
  return useQuery({
    queryKey: ['training', 'sop-ack', 'worker', workerId, view || 'all', nextFilters],
    queryFn: () => view === 'pending' ? sopAckService.workerPending(workerId, nextFilters) : sopAckService.worker(workerId, nextFilters),
    enabled: Boolean(workerId)
  });
}
