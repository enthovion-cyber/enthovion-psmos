import { useQuery } from '@tanstack/react-query';
import { psiCompletenessService } from '../services/psi-completeness.service';

export function usePsiCompletenessScores(filters: Record<string, unknown> = {}) {
  return useQuery({ queryKey: ['psi', 'completeness', 'scores', filters], queryFn: () => psiCompletenessService.scores(filters) });
}
