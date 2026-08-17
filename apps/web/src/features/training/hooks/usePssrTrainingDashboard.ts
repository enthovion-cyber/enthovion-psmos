import { useQuery } from '@tanstack/react-query';
import { pssrTrainingService } from '../services/pssr-training.service';

export function usePssrTrainingDashboard(filters: Record<string, unknown> = {}) {
  return useQuery({ queryKey: ['training', 'pssr', 'dashboard', filters], queryFn: () => pssrTrainingService.dashboard(filters) });
}

