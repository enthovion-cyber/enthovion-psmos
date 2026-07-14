import { useQuery } from '@tanstack/react-query';
import { lopaOverviewService } from '../services/lopa-overview.service';

export function useLopaRecentActivity(id: string) {
  return useQuery({ queryKey: ['lopa', 'recent-activity', id], queryFn: () => lopaOverviewService.recentActivity(id), enabled: !!id });
}
