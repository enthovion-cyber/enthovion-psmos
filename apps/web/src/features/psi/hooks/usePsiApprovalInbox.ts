import { useQuery } from '@tanstack/react-query';
import { psiReviewApprovalService } from '../services/psi-review-approval.service';

export function usePsiApprovalInbox(filters: Record<string, unknown> = {}) {
  return useQuery({ queryKey: ['psi', 'review-approval', 'inbox', filters], queryFn: () => psiReviewApprovalService.inbox(filters) });
}
