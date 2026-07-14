import { useQuery } from '@tanstack/react-query';
import { pssrTrainingReadinessService } from '../services/pssr-training-readiness.service';

export function usePSSRTrainingReadiness(pssrId: string) {
  return useQuery({ queryKey: ['pssr', pssrId, 'training-readiness'], queryFn: () => pssrTrainingReadinessService.get(pssrId), enabled: Boolean(pssrId), refetchOnWindowFocus: false });
}
