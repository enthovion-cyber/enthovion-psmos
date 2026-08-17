import { useQuery } from '@tanstack/react-query';
import { mocTrainingService } from '../services/moc-training.service';

export function useMocTrainingImpactCheck(filters: Record<string, unknown> = {}) {
  return useQuery({ queryKey: ['training', 'moc', 'impact-checks', filters], queryFn: () => mocTrainingService.impactChecks(filters) });
}
