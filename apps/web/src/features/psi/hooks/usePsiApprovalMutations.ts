import { useMutation, useQueryClient } from '@tanstack/react-query';
import { psiReviewApprovalService } from '../services/psi-review-approval.service';

export function usePsiApprovalMutations() {
  const queryClient = useQueryClient();
  return useMutation<unknown, Error, { action: 'approve' | 'reject' | 'return' | 'withdraw' | 'resubmit' | 'validate' | 'delegate' | 'escalate' | 'override' | 'comment' | 'archiveRule' | 'updateSettings'; approvalId?: string; ruleId?: string; data?: Record<string, unknown> }>({
    mutationFn: (input: { action: 'approve' | 'reject' | 'return' | 'withdraw' | 'resubmit' | 'validate' | 'delegate' | 'escalate' | 'override' | 'comment' | 'archiveRule' | 'updateSettings'; approvalId?: string; ruleId?: string; data?: Record<string, unknown> }) => {
      const data = input.data ?? {};
      if (input.action === 'approve' && input.approvalId) return psiReviewApprovalService.approve(input.approvalId, data);
      if (input.action === 'reject' && input.approvalId) return psiReviewApprovalService.reject(input.approvalId, data);
      if (input.action === 'return' && input.approvalId) return psiReviewApprovalService.returnForChanges(input.approvalId, data);
      if (input.action === 'withdraw' && input.approvalId) return psiReviewApprovalService.withdraw(input.approvalId, data);
      if (input.action === 'resubmit' && input.approvalId) return psiReviewApprovalService.resubmit(input.approvalId, data);
      if (input.action === 'validate' && input.approvalId) return psiReviewApprovalService.validate(input.approvalId);
      if (input.action === 'delegate' && input.approvalId) return psiReviewApprovalService.delegate(input.approvalId, data);
      if (input.action === 'escalate' && input.approvalId) return psiReviewApprovalService.escalate(input.approvalId, data);
      if (input.action === 'override' && input.approvalId) return psiReviewApprovalService.override(input.approvalId, data);
      if (input.action === 'comment' && input.approvalId) return psiReviewApprovalService.addComment(input.approvalId, data);
      if (input.action === 'archiveRule' && input.ruleId) return psiReviewApprovalService.archiveRule(input.ruleId, data);
      if (input.action === 'updateSettings') return psiReviewApprovalService.updateSettings(data);
      throw new Error('Unsupported PSI approval mutation.');
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['psi', 'review-approval'] })
  });
}
