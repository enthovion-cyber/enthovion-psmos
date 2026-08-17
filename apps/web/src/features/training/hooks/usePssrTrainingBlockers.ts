import { useQuery } from '@tanstack/react-query';
import { pssrTrainingService } from '../services/pssr-training.service';

export function usePssrTrainingBlockers(filters: Record<string, unknown> = {}) {
  return useQuery({ queryKey: ['training', 'pssr', 'blockers', filters], queryFn: () => pssrTrainingService.blockers(filters) });
}

