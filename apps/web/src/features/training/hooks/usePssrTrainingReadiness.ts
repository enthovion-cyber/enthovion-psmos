import { useQuery } from '@tanstack/react-query';
import { pssrTrainingService } from '../services/pssr-training.service';

export function usePssrTrainingReadiness(readinessId: string) {
  return useQuery({ queryKey: ['training', 'pssr', 'readiness', readinessId], queryFn: () => pssrTrainingService.readiness(readinessId), enabled: Boolean(readinessId) });
}

