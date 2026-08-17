import { useQuery } from '@tanstack/react-query';
import { mocTrainingService } from '../services/moc-training.service';

export function useMocTrainingDashboard(filters: Record<string, unknown> = {}) {
  return useQuery({ queryKey: ['training', 'moc', 'dashboard', filters], queryFn: () => mocTrainingService.dashboard(filters) });
}
