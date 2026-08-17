import { useQuery } from '@tanstack/react-query';
import { psiReviewApprovalService } from '../services/psi-review-approval.service';

export function usePsiApprovalDetail(approvalId: string, enabled = true) {
  return useQuery({ queryKey: ['psi', 'review-approval', 'detail', approvalId], queryFn: () => psiReviewApprovalService.detail(approvalId), enabled: enabled && Boolean(approvalId) });
}
