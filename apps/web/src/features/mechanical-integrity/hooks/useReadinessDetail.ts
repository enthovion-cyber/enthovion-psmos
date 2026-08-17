import { useQuery } from '@tanstack/react-query';
import { readinessService } from '../services/readiness.service';

export function useReadinessDetail(id?: string) {
  return useQuery({ queryKey: ['mechanical-integrity', 'readiness-detail', id], queryFn: () => readinessService.get(id as string), enabled: Boolean(id) });
}
