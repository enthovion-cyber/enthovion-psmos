import { useMutation, useQueryClient } from '@tanstack/react-query';
import { assessmentService } from '../services/assessment.service';

export function useAssessmentMutations(assessmentId?: string) {
  const client = useQueryClient();
  const invalidate = () => client.invalidateQueries({ queryKey: ['training', 'assessments'] });
  return {
    create: useMutation({ mutationFn: assessmentService.create, onSuccess: invalidate }),
    update: useMutation({ mutationFn: (payload: Record<string, unknown>) => assessmentService.update(String(assessmentId), payload), onSuccess: invalidate }),
    archive: useMutation({ mutationFn: (payload?: Record<string, unknown>) => assessmentService.archive(String(assessmentId), payload), onSuccess: invalidate }),
    addQuestion: useMutation({ mutationFn: (payload: Record<string, unknown>) => assessmentService.addQuestion(String(assessmentId), payload), onSuccess: invalidate }),
    createAssignment: useMutation({ mutationFn: assessmentService.createAssignment, onSuccess: invalidate })
  };
}
