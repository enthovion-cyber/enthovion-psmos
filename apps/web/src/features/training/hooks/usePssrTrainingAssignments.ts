import { useQuery } from '@tanstack/react-query';
import { pssrTrainingService } from '../services/pssr-training.service';

export function usePssrTrainingAssignments(filters: Record<string, unknown> = {}) {
  return useQuery({ queryKey: ['training', 'pssr', 'assignments', filters], queryFn: () => pssrTrainingService.assignments(filters) });
}

