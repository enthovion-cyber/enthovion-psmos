import { useQuery } from '@tanstack/react-query';
import { mocTrainingService } from '../services/moc-training.service';

export function useMocTrainingAssignments(filters: Record<string, unknown> = {}) {
  return useQuery({ queryKey: ['training', 'moc', 'assignments', filters], queryFn: () => mocTrainingService.assignments(filters) });
}
