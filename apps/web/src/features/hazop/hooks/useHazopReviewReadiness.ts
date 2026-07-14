'use client';

import { useQuery } from '@tanstack/react-query';
import { hazopReviewService } from '../services/hazop-review.service';

export function useHazopReviewReadiness(studyId: string) {
  const enabled = Boolean(studyId);
  return {
    readiness: useQuery({ queryKey: ['hazop', studyId, 'review-readiness'], queryFn: () => hazopReviewService.readiness(studyId), enabled }),
    blockers: useQuery({ queryKey: ['hazop', studyId, 'review-blockers'], queryFn: () => hazopReviewService.blockers(studyId), enabled }),
    workflow: useQuery({ queryKey: ['hazop', studyId, 'review-workflow'], queryFn: () => hazopReviewService.workflow(studyId), enabled }),
    comments: useQuery({ queryKey: ['hazop', studyId, 'review-comments'], queryFn: () => hazopReviewService.comments(studyId), enabled })
  };
}
