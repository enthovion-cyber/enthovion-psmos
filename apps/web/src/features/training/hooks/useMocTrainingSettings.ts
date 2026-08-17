import { useQuery } from '@tanstack/react-query';
import { mocTrainingService } from '../services/moc-training.service';

export function useMocTrainingSettings(filters: Record<string, unknown> = {}) {
  return useQuery({ queryKey: ['training', 'moc', 'settings', filters], queryFn: () => mocTrainingService.settings(filters) });
}
