import { useQuery } from '@tanstack/react-query';
import { requiredTrainingService } from '../services/required-training.service';

export function useRequiredTrainingDashboard(params: Record<string, unknown> = {}) {
  return useQuery({ queryKey: ['required-training', 'dashboard', params], queryFn: () => requiredTrainingService.dashboard(params) });
}
