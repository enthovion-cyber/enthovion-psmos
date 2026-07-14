import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { incidentReviewApprovalService } from '../services/incident-review-approval.service';
import type { IncidentReviewApprovalData } from '../types/incident-review-approval.types';

export function useIncidentReviewApproval(id: string) {
  return useQuery<IncidentReviewApprovalData>({ queryKey: ['incidents', 'review-approval', id], queryFn: () => incidentReviewApprovalService.tab(id), enabled: !!id, refetchOnWindowFocus: false });
}

export function useIncidentReviewApprovalMutations(id: string) {
  const queryClient = useQueryClient();
  const invalidate = () => Promise.all([
    queryClient.invalidateQueries({ queryKey: ['incidents', 'review-approval', id] }),
    queryClient.invalidateQueries({ queryKey: ['incidents', 'detail', id] }),
    queryClient.invalidateQueries({ queryKey: ['incidents', 'overview', id] }),
    queryClient.invalidateQueries({ queryKey: ['incidents', 'dashboard'] })
  ]);
  return {
    runReadinessCheck: useMutation({ mutationFn: (values: any) => incidentReviewApprovalService.runReadinessCheck(id, values), onSuccess: invalidate }),
    startWorkflow: useMutation({ mutationFn: (values: any) => incidentReviewApprovalService.startWorkflow(id, values), onSuccess: invalidate }),
    createReviewer: useMutation({ mutationFn: (values: any) => incidentReviewApprovalService.createReviewer(id, values), onSuccess: invalidate }),
    updateReviewer: useMutation({ mutationFn: ({ reviewerId, values }: any) => incidentReviewApprovalService.updateReviewer(id, reviewerId, values), onSuccess: invalidate }),
    removeReviewer: useMutation({ mutationFn: ({ reviewerId, values }: any) => incidentReviewApprovalService.removeReviewer(id, reviewerId, values), onSuccess: invalidate }),
    requestReviewer: useMutation({ mutationFn: ({ reviewerId, values }: any) => incidentReviewApprovalService.requestReviewer(id, reviewerId, values), onSuccess: invalidate }),
    approveReviewer: useMutation({ mutationFn: ({ reviewerId, values }: any) => incidentReviewApprovalService.approveReviewer(id, reviewerId, values), onSuccess: invalidate }),
    rejectReviewer: useMutation({ mutationFn: ({ reviewerId, values }: any) => incidentReviewApprovalService.rejectReviewer(id, reviewerId, values), onSuccess: invalidate }),
    requestReviewerChanges: useMutation({ mutationFn: ({ reviewerId, values }: any) => incidentReviewApprovalService.requestReviewerChanges(id, reviewerId, values), onSuccess: invalidate }),
    delegateReviewer: useMutation({ mutationFn: ({ reviewerId, values }: any) => incidentReviewApprovalService.delegateReviewer(id, reviewerId, values), onSuccess: invalidate }),
    escalateReviewer: useMutation({ mutationFn: ({ reviewerId, values }: any) => incidentReviewApprovalService.escalateReviewer(id, reviewerId, values), onSuccess: invalidate }),
    eSign: useMutation({ mutationFn: (values: any) => incidentReviewApprovalService.eSign(id, values), onSuccess: invalidate }),
    overrideBlocker: useMutation({ mutationFn: ({ blockerId, values }: any) => incidentReviewApprovalService.overrideBlocker(id, blockerId, values), onSuccess: invalidate }),
    createChangeRequest: useMutation({ mutationFn: (values: any) => incidentReviewApprovalService.createChangeRequest(id, values), onSuccess: invalidate }),
    updateChangeRequest: useMutation({ mutationFn: ({ requestId, values }: any) => incidentReviewApprovalService.updateChangeRequest(id, requestId, values), onSuccess: invalidate }),
    resolveChangeRequest: useMutation({ mutationFn: ({ requestId, values }: any) => incidentReviewApprovalService.resolveChangeRequest(id, requestId, values), onSuccess: invalidate }),
    requestClosure: useMutation({ mutationFn: (values: any) => incidentReviewApprovalService.requestClosure(id, values), onSuccess: invalidate }),
    approveClosure: useMutation({ mutationFn: (values: any) => incidentReviewApprovalService.approveClosure(id, values), onSuccess: invalidate }),
    closeIncident: useMutation({ mutationFn: (values: any) => incidentReviewApprovalService.closeIncident(id, values), onSuccess: invalidate }),
    reopenIncident: useMutation({ mutationFn: (values: any) => incidentReviewApprovalService.reopenIncident(id, values), onSuccess: invalidate })
  };
}
