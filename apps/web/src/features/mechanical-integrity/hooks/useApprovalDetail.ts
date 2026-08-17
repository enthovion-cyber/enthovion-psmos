import { useQuery } from '@tanstack/react-query';
import { reviewApprovalService } from '../services/review-approval.service';

export function useApprovalDetail(approvalId?: string) {
  return useQuery({ queryKey: ['mechanical-integrity', 'review-approval-detail', approvalId], queryFn: () => reviewApprovalService.detail(approvalId as string), enabled: Boolean(approvalId) });
}
