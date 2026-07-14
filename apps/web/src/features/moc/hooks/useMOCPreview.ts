import { useQuery } from '@tanstack/react-query';
import { mocDashboardService } from '../services/moc-dashboard.service';

export function useMOCPreview(id?: string) {
  return useQuery({
    queryKey: ['moc', id, 'preview'],
    queryFn: () => mocDashboardService.preview(id as string),
    enabled: Boolean(id),
    refetchOnWindowFocus: false
  });
}
