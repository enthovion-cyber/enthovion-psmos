import { useQuery } from '@tanstack/react-query';
import { mocDashboardService } from '../services/moc-dashboard.service';
import { useMOCDashboardStore } from '../stores/moc-dashboard.store';

export function useMOCRegister() {
  const filters = useMOCDashboardStore((state) => state.filters);
  return useQuery({
    queryKey: ['moc', 'dashboard-register', filters],
    queryFn: () => mocDashboardService.register(filters),
    refetchOnWindowFocus: false
  });
}
