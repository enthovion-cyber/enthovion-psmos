import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { trainingApprovalPackageService } from '../services/training-approval-package.service';
import { trainingReviewService } from '../services/training-review.service';

export function useTrainingApprovalPackages(params: Record<string, unknown> = {}) {
  return useQuery({ queryKey: ['training', 'review', 'packages', params], queryFn: () => trainingApprovalPackageService.list(params) });
}
export function useTrainingApprovalPackageDetail(approvalId?: string) {
  return useQuery({ queryKey: ['training', 'review', 'package', approvalId], queryFn: () => trainingApprovalPackageService.detail(approvalId as string), enabled: Boolean(approvalId) });
}
export function useTrainingApprovalFiltered(view: string, params: Record<string, unknown> = {}) {
  return useQuery({ queryKey: ['training', 'review', view, params], queryFn: () => trainingReviewService.filtered(view, params) });
}
export function useTrainingApprovalMutations(approvalId?: string) {
  const client = useQueryClient();
  const invalidate = () => client.invalidateQueries({ queryKey: ['training', 'review'] });
  const id = approvalId ?? '';
  return {
    create: useMutation({ mutationFn: trainingApprovalPackageService.create, onSuccess: invalidate }),
    validate: useMutation({ mutationFn: (data: Record<string, any> = {}) => trainingApprovalPackageService.validate(id, data), onSuccess: invalidate }),
    approve: useMutation({ mutationFn: (data: Record<string, any> = {}) => trainingApprovalPackageService.approve(id, data), onSuccess: invalidate }),
    approveWithConditions: useMutation({ mutationFn: (data: Record<string, any> = {}) => trainingApprovalPackageService.approveWithConditions(id, data), onSuccess: invalidate }),
    reject: useMutation({ mutationFn: (data: Record<string, any>) => trainingApprovalPackageService.reject(id, data), onSuccess: invalidate }),
    returnForCorrection: useMutation({ mutationFn: (data: Record<string, any>) => trainingApprovalPackageService.returnForCorrection(id, data), onSuccess: invalidate }),
    requestCorrection: useMutation({ mutationFn: (data: Record<string, any>) => trainingApprovalPackageService.requestCorrection(id, data), onSuccess: invalidate }),
    escalate: useMutation({ mutationFn: (data: Record<string, any>) => trainingApprovalPackageService.escalate(id, data), onSuccess: invalidate }),
    reassign: useMutation({ mutationFn: (data: Record<string, any>) => trainingApprovalPackageService.reassign(id, data), onSuccess: invalidate }),
    cancel: useMutation({ mutationFn: (data: Record<string, any>) => trainingApprovalPackageService.cancel(id, data), onSuccess: invalidate }),
    resubmit: useMutation({ mutationFn: (data: Record<string, any> = {}) => trainingApprovalPackageService.resubmit(id, data), onSuccess: invalidate }),
    comment: useMutation({ mutationFn: (data: Record<string, any>) => trainingApprovalPackageService.comment(id, data), onSuccess: invalidate })
  };
}
