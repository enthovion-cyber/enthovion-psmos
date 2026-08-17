import { useQuery } from '@tanstack/react-query';
import { mocTrainingService } from '../services/moc-training.service';

export function useMocTrainingWaivers(filters: Record<string, unknown> = {}) {
  return useQuery({ queryKey: ['training', 'moc', 'waivers', filters], queryFn: () => mocTrainingService.waivers(filters) });
}
