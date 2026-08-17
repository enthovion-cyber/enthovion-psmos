import { useQuery } from '@tanstack/react-query';
import { mocTrainingService } from '../services/moc-training.service';

export function useMocTrainingReadiness(requirementId: string) {
  return useQuery({ queryKey: ['training', 'moc', 'readiness', requirementId], queryFn: () => mocTrainingService.readiness(requirementId), enabled: Boolean(requirementId) });
}
