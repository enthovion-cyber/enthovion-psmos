import { useQuery } from '@tanstack/react-query';
import { workforceService } from '../services/workforce.service';

export function useWorkerDetail(workerId: string) {
  return useQuery({ queryKey: ['training', 'worker', workerId], queryFn: () => workforceService.worker(workerId), enabled: Boolean(workerId) });
}
