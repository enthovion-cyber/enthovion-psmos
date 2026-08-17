import { useQuery } from '@tanstack/react-query';
import { mocTrainingService } from '../services/moc-training.service';

export function useMocAffectedWorkers(requirementId: string, filters: Record<string, unknown> = {}) {
  return useQuery({ queryKey: ['training', 'moc', 'affected-workers', requirementId, filters], queryFn: () => mocTrainingService.affectedWorkers(requirementId, filters), enabled: Boolean(requirementId) });
}
