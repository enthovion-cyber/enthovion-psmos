import { useQuery } from '@tanstack/react-query';
import { pssrTrainingService } from '../services/pssr-training.service';

export function usePssrTrainingImpactCheck(filters: Record<string, unknown> = {}) {
  return useQuery({ queryKey: ['training', 'pssr', 'impact-checks', filters], queryFn: () => pssrTrainingService.impactChecks(filters) });
}

