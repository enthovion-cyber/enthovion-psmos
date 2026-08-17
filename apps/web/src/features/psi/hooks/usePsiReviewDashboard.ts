import { useQuery } from '@tanstack/react-query';
import { psiReviewApprovalService } from '../services/psi-review-approval.service';

export function usePsiReviewDashboard(filters: Record<string, unknown> = {}) {
  return useQuery({ queryKey: ['psi', 'review-approval', 'dashboard', filters], queryFn: () => psiReviewApprovalService.dashboard(filters) });
}
