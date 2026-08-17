import { useQuery } from '@tanstack/react-query';
import { mocTrainingService } from '../services/moc-training.service';

export function useMocTrainingRequirements(filters: Record<string, unknown> = {}) {
  return useQuery({ queryKey: ['training', 'moc', 'requirements', filters], queryFn: () => mocTrainingService.register(filters) });
}
