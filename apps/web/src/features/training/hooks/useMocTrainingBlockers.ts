import { useQuery } from '@tanstack/react-query';
import { mocTrainingService } from '../services/moc-training.service';

export function useMocTrainingBlockers(filters: Record<string, unknown> = {}) {
  return useQuery({ queryKey: ['training', 'moc', 'blockers', filters], queryFn: () => mocTrainingService.blockers(filters) });
}
