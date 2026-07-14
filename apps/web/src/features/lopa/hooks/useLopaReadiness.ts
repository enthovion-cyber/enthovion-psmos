import { useQuery } from '@tanstack/react-query';
import { lopaOverviewService } from '../services/lopa-overview.service';

export function useLopaReadiness(id: string) {
  return useQuery({ queryKey: ['lopa', 'readiness', id], queryFn: () => lopaOverviewService.readiness(id), enabled: !!id });
}
