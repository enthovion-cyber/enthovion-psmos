import { useQuery } from '@tanstack/react-query';
import { psiDashboardService } from '../services/psi-dashboard.service';

export function usePsiDashboard(filters: Record<string, unknown> = {}) {
  return useQuery({ queryKey: ['psi', 'dashboard', filters], queryFn: () => psiDashboardService.dashboard(filters) });
}
