import { useMutation, useQueryClient } from '@tanstack/react-query';
import { reviewApprovalService } from '../services/review-approval.service';

export function useApprovalMutations(approvalId?: string) {
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['mechanical-integrity', 'review-approval'] });
  const invalidateDetail = () => {
    void invalidate();
    if (approvalId) void queryClient.invalidateQueries({ queryKey: ['mechanical-integrity', 'review-approval-detail', approvalId] });
  };
  return {
    approve: useMutation({ mutationFn: (input: Record<string, unknown>) => reviewApprovalService.approve(approvalId as string, input), onSuccess: invalidateDetail }),
    reject: useMutation({ mutationFn: (input: Record<string, unknown>) => reviewApprovalService.reject(approvalId as string, input), onSuccess: invalidateDetail }),
    returnForCorrection: useMutation({ mutationFn: (input: Record<string, unknown>) => reviewApprovalService.returnForCorrection(approvalId as string, input), onSuccess: invalidateDetail }),
    approveWithConditions: useMutation({ mutationFn: (input: Record<string, unknown>) => reviewApprovalService.approveWithConditions(approvalId as string, input), onSuccess: invalidateDetail }),
    requestInfo: useMutation({ mutationFn: (input: Record<string, unknown>) => reviewApprovalService.requestInfo(approvalId as string, input), onSuccess: invalidateDetail }),
    delegate: useMutation({ mutationFn: (input: Record<string, unknown>) => reviewApprovalService.delegate(approvalId as string, input), onSuccess: invalidateDetail }),
    escalate: useMutation({ mutationFn: (input: Record<string, unknown>) => reviewApprovalService.escalate(approvalId as string, input), onSuccess: invalidateDetail }),
    runValidations: useMutation({ mutationFn: () => reviewApprovalService.runValidations(approvalId as string), onSuccess: invalidateDetail }),
    addComment: useMutation({ mutationFn: (input: Record<string, unknown>) => reviewApprovalService.addComment(approvalId as string, input), onSuccess: invalidateDetail }),
    addCondition: useMutation({ mutationFn: (input: Record<string, unknown>) => reviewApprovalService.addCondition(approvalId as string, input), onSuccess: invalidateDetail })
  };
}
