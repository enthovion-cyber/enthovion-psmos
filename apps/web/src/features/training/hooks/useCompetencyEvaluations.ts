import { useQuery } from '@tanstack/react-query';
import { competencyEvaluationService } from '../services/competency-evaluation.service';

export function useCompetencyEvaluations(params?: Record<string, unknown>) {
  return useQuery({ queryKey: ['competency-evaluations', params], queryFn: () => competencyEvaluationService.runs(params) });
}
