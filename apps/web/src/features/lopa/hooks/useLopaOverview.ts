import { useQuery } from '@tanstack/react-query';
import { lopaOverviewService } from '../services/lopa-overview.service';

export function useLopaOverview(id: string) {
  return useQuery({ queryKey: ['lopa', 'overview', id], queryFn: () => lopaOverviewService.overview(id), enabled: !!id });
}
