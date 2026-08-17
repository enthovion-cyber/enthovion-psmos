import { useQuery } from '@tanstack/react-query';
import { workforceService } from '../services/workforce.service';

export function useWorkforce(filters: Record<string, unknown> = {}) {
  return useQuery({ queryKey: ['training', 'workforce', filters], queryFn: () => workforceService.workforce(filters) });
}

export function useTrainingContext(params: Record<string, unknown> = {}) {
  return useQuery({ queryKey: ['training', 'context', params], queryFn: () => workforceService.context(params), staleTime: 300_000 });
}
