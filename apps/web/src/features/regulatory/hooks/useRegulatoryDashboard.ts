import { useQuery } from '@tanstack/react-query';
import { regulatoryDashboardService } from '../services/regulatory-dashboard.service';

export function useRegulatoryDashboard(filters?: Record<string, unknown>) {
  return useQuery({ queryKey: ['regulatory', 'dashboard', filters], queryFn: () => regulatoryDashboardService.dashboard(filters), refetchOnWindowFocus: false });
}
