import { useQuery } from '@tanstack/react-query';
import { mocTrainingService } from '../services/moc-training.service';

export function useMocTrainingRequirementDetail(requirementId: string) {
  return useQuery({ queryKey: ['training', 'moc', 'requirement', requirementId], queryFn: () => mocTrainingService.detail(requirementId), enabled: Boolean(requirementId) });
}
