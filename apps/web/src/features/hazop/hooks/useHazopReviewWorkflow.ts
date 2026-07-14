'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { hazopReviewService } from '../services/hazop-review.service';

export function useHazopReviewWorkflow(studyId: string) {
  const queryClient = useQueryClient();
  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ['hazop'] });
    void queryClient.invalidateQueries({ queryKey: ['hazop', studyId] });
    void queryClient.invalidateQueries({ queryKey: ['hazop', studyId, 'header'] });
    void queryClient.invalidateQueries({ queryKey: ['hazop', studyId, 'overview'] });
    void queryClient.invalidateQueries({ queryKey: ['hazop', studyId, 'review'] });
    void queryClient.invalidateQueries({ queryKey: ['hazop', studyId, 'review-readiness'] });
    void queryClient.invalidateQueries({ queryKey: ['hazop', studyId, 'review-blockers'] });
    void queryClient.invalidateQueries({ queryKey: ['hazop', studyId, 'review-workflow'] });
    void queryClient.invalidateQueries({ queryKey: ['hazop', studyId, 'signoffs'] });
    void queryClient.invalidateQueries({ queryKey: ['hazop-dashboard'] });
  };
  return {
    recalculate: useMutation({ mutationFn: () => hazopReviewService.recalculate(studyId), onSuccess: invalidate }),
    start: useMutation({ mutationFn: (values?: Record<string, any>) => hazopReviewService.start(studyId, values), onSuccess: invalidate }),
    requestApproval: useMutation({ mutationFn: (values?: Record<string, any>) => hazopReviewService.requestApproval(studyId, values), onSuccess: invalidate }),
    approve: useMutation({ mutationFn: (values?: Record<string, any>) => hazopReviewService.approve(studyId, values), onSuccess: invalidate }),
    reject: useMutation({ mutationFn: (values: Record<string, any>) => hazopReviewService.reject(studyId, values), onSuccess: invalidate }),
    returnForRework: useMutation({ mutationFn: (values: Record<string, any>) => hazopReviewService.returnForRework(studyId, values), onSuccess: invalidate }),
    close: useMutation({ mutationFn: (values?: Record<string, any>) => hazopReviewService.close(studyId, values), onSuccess: invalidate }),
    reopen: useMutation({ mutationFn: (values: Record<string, any>) => hazopReviewService.reopen(studyId, values), onSuccess: invalidate }),
    exportPackage: useMutation({ mutationFn: () => hazopReviewService.exportPackage(studyId) })
  };
}
