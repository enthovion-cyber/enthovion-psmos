import { useQuery } from '@tanstack/react-query';
import { pssrTrainingService } from '../services/pssr-training.service';

export function usePssrTrainingSettings(filters: Record<string, unknown> = {}) {
  return useQuery({ queryKey: ['training', 'pssr', 'settings', filters], queryFn: () => pssrTrainingService.settings(filters) });
}

