import { useQuery } from '@tanstack/react-query';
import { reviewApprovalService } from '../services/review-approval.service';

export type ReviewApprovalView = 'dashboard' | 'inbox' | 'my-approvals' | 'pending' | 'overdue' | 'escalated' | 'completed';

export function useReviewApprovals(params: Record<string, unknown> = {}, view: ReviewApprovalView = 'dashboard') {
  const load = () => {
    if (view === 'inbox') return reviewApprovalService.inbox(params);
    if (view === 'my-approvals') return reviewApprovalService.myApprovals(params);
    if (view === 'pending') return reviewApprovalService.pending(params);
    if (view === 'overdue') return reviewApprovalService.overdue(params);
    if (view === 'escalated') return reviewApprovalService.escalated(params);
    if (view === 'completed') return reviewApprovalService.completed(params);
    return reviewApprovalService.list(params);
  };
  return useQuery({ queryKey: ['mechanical-integrity', 'review-approval', view, params], queryFn: load });
}

export function useReviewApprovalLookups() {
  return useQuery({ queryKey: ['mechanical-integrity', 'review-approval-lookups'], queryFn: reviewApprovalService.lookups });
}
