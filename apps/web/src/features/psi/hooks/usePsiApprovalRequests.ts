import { useQuery } from '@tanstack/react-query';
import { psiReviewApprovalService } from '../services/psi-review-approval.service';

export function usePsiApprovalRequests(view = '', filters: Record<string, unknown> = {}) {
  return useQuery({ queryKey: ['psi', 'review-approval', 'requests', view, filters], queryFn: () => psiReviewApprovalService.register(view, filters) });
}
