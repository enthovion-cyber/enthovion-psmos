import { useQuery } from '@tanstack/react-query';
import { psiReviewApprovalService } from '../services/psi-review-approval.service';

export function usePsiApprovalRules(filters: Record<string, unknown> = {}) {
  return useQuery({ queryKey: ['psi', 'review-approval', 'rules', filters], queryFn: () => psiReviewApprovalService.rules(filters) });
}
