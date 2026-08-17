import { useQuery } from '@tanstack/react-query';
import { trainingDashboardService } from '../services/training-dashboard.service';

export function useTrainingDashboard(filters: Record<string, unknown> = {}) {
  return useQuery({ queryKey: ['training', 'dashboard', filters], queryFn: () => trainingDashboardService.dashboard(filters) });
}
