'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { hazopReviewService } from '../services/hazop-review.service';

export function useHazopReviewComments(studyId: string) {
  const queryClient = useQueryClient();
  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ['hazop', studyId, 'review-comments'] });
    void queryClient.invalidateQueries({ queryKey: ['hazop', studyId, 'review-readiness'] });
    void queryClient.invalidateQueries({ queryKey: ['hazop', studyId, 'review-blockers'] });
    void queryClient.invalidateQueries({ queryKey: ['hazop', studyId, 'review'] });
  };
  return {
    add: useMutation({ mutationFn: (values: Record<string, any>) => hazopReviewService.addComment(studyId, values), onSuccess: invalidate }),
    update: useMutation({ mutationFn: ({ commentId, values }: { commentId: string; values: Record<string, any> }) => hazopReviewService.updateComment(studyId, commentId, values), onSuccess: invalidate }),
    resolve: useMutation({ mutationFn: ({ commentId, values }: { commentId: string; values: Record<string, any> }) => hazopReviewService.resolveComment(studyId, commentId, values), onSuccess: invalidate }),
    createAction: useMutation({ mutationFn: ({ commentId, values }: { commentId: string; values: Record<string, any> }) => hazopReviewService.createCommentAction(studyId, commentId, values), onSuccess: invalidate })
  };
}
