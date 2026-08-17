import { useQuery } from '@tanstack/react-query';
import { pssrTrainingService } from '../services/pssr-training.service';

export function usePssrTrainingReadinessDetail(readinessId: string) {
  return useQuery({ queryKey: ['training', 'pssr', 'readiness', readinessId], queryFn: () => pssrTrainingService.detail(readinessId), enabled: Boolean(readinessId) });
}

