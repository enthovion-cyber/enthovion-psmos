import { useQuery } from '@tanstack/react-query';
import { assessmentService } from '../services/assessment.service';

export function useAssessmentResults(filters: Record<string, unknown> = {}) {
  return useQuery({ queryKey: ['training', 'assessment-results', filters], queryFn: () => assessmentService.results(filters) });
}
