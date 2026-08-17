import { useQuery } from '@tanstack/react-query';
import { pssrTrainingService } from '../services/pssr-training.service';

export function usePssrTrainingWaivers(filters: Record<string, unknown> = {}) {
  return useQuery({ queryKey: ['training', 'pssr', 'waivers', filters], queryFn: () => pssrTrainingService.waivers(filters) });
}

