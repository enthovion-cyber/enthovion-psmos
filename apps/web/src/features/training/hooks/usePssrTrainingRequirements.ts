import { useQuery } from '@tanstack/react-query';
import { pssrTrainingService } from '../services/pssr-training.service';

export function usePssrTrainingReadiness(filters: Record<string, unknown> = {}) {
  return useQuery({ queryKey: ['training', 'pssr', 'readiness', filters], queryFn: () => pssrTrainingService.register(filters) });
}

