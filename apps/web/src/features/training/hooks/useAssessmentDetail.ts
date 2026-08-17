import { useQuery } from '@tanstack/react-query';
import { assessmentService } from '../services/assessment.service';

export function useAssessmentDetail(assessmentId: string) {
  return useQuery({ queryKey: ['training', 'assessments', assessmentId], queryFn: () => assessmentService.detail(assessmentId), enabled: Boolean(assessmentId) });
}
