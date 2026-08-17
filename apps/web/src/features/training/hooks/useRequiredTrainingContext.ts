import { useQuery } from '@tanstack/react-query';
import { requiredTrainingService } from '../services/required-training.service';

export function useRequiredTrainingContext(params: Record<string, unknown> = {}) {
  return useQuery({ queryKey: ['required-training', 'context', params], queryFn: () => requiredTrainingService.context(params), staleTime: 60_000 });
}
