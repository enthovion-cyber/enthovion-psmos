import { useQuery } from '@tanstack/react-query';
import { mocDashboardService } from '../services/moc-dashboard.service';
import { useMOCDashboardStore } from '../stores/moc-dashboard.store';

export function useMOCDashboard() {
  const filters = useMOCDashboardStore((state) => state.filters);
  return useQuery({
    queryKey: ['moc', 'dashboard', filters],
    queryFn: () => mocDashboardService.dashboard(filters),
    refetchInterval: 30000,
    refetchOnWindowFocus: false
  });
}
