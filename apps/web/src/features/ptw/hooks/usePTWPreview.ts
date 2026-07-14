import { useQuery } from '@tanstack/react-query';
import { ptwDashboardService } from '../services/ptw-dashboard.service';

export function usePTWPreview(id?: string | null) {
  return useQuery({
    queryKey: ['ptw', 'preview', id],
    queryFn: () => ptwDashboardService.preview(id!),
    enabled: Boolean(id),
    refetchInterval: 30000
  });
}
