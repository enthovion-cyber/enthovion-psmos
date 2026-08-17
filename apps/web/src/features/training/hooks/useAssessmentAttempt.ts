import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { assessmentAttemptService } from '../services/assessment-attempt.service';

export function useAssessmentAttempt(attemptId: string) {
  return useQuery({ queryKey: ['training', 'assessment-attempt', attemptId], queryFn: () => assessmentAttemptService.detail(attemptId), enabled: Boolean(attemptId) });
}

export function useAssessmentAttemptMutations(attemptId: string) {
  const client = useQueryClient();
  const invalidate = () => client.invalidateQueries({ queryKey: ['training', 'assessment-attempt', attemptId] });
  return {
    saveAnswer: useMutation({ mutationFn: (payload: Record<string, unknown>) => assessmentAttemptService.saveAnswer(attemptId, payload), onSuccess: invalidate }),
    submit: useMutation({ mutationFn: (payload?: Record<string, unknown>) => assessmentAttemptService.submit(attemptId, payload), onSuccess: invalidate }),
    grade: useMutation({ mutationFn: (payload: Record<string, unknown>) => assessmentAttemptService.grade(attemptId, payload), onSuccess: invalidate }),
    verify: useMutation({ mutationFn: (payload?: Record<string, unknown>) => assessmentAttemptService.verify(attemptId, payload), onSuccess: invalidate }),
    reopen: useMutation({ mutationFn: (payload: Record<string, unknown>) => assessmentAttemptService.reopen(attemptId, payload), onSuccess: invalidate })
  };
}
