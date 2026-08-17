import { useQuery } from '@tanstack/react-query';
import { psiReviewApprovalService } from '../services/psi-review-approval.service';

export function usePsiApprovalSettings(filters: Record<string, unknown> = {}) {
  return useQuery({ queryKey: ['psi', 'review-approval', 'settings', filters], queryFn: () => psiReviewApprovalService.settings(filters) });
}
