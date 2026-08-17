import { useMutation, useQueryClient } from '@tanstack/react-query';
import { regulatoryComplianceService } from '../services/regulatory-compliance.service';

export function useRegulatoryComplianceMutations() {
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['regulatory', 'compliance'] });
  return {
    create: useMutation({ mutationFn: regulatoryComplianceService.create, onSuccess: invalidate }),
    update: useMutation({ mutationFn: ({ assessmentId, data }: { assessmentId: string; data: Record<string, unknown> }) => regulatoryComplianceService.update(assessmentId, data), onSuccess: invalidate }),
    changeStatus: useMutation({ mutationFn: ({ assessmentId, data }: { assessmentId: string; data: Record<string, unknown> }) => regulatoryComplianceService.changeStatus(assessmentId, data), onSuccess: invalidate }),
    complete: useMutation({ mutationFn: ({ assessmentId, data }: { assessmentId: string; data?: Record<string, unknown> }) => regulatoryComplianceService.complete(assessmentId, data), onSuccess: invalidate }),
    submitReview: useMutation({ mutationFn: ({ assessmentId, data }: { assessmentId: string; data?: Record<string, unknown> }) => regulatoryComplianceService.submitReview(assessmentId, data), onSuccess: invalidate }),
    markStale: useMutation({ mutationFn: ({ assessmentId, data }: { assessmentId: string; data: Record<string, unknown> }) => regulatoryComplianceService.markStale(assessmentId, data), onSuccess: invalidate }),
    runReadiness: useMutation({ mutationFn: regulatoryComplianceService.runReadiness, onSuccess: invalidate }),
    detectGaps: useMutation({ mutationFn: regulatoryComplianceService.detectGaps, onSuccess: invalidate }),
    createGap: useMutation({ mutationFn: regulatoryComplianceService.createGap, onSuccess: invalidate }),
    resolveGap: useMutation({ mutationFn: ({ gapId, reason }: { gapId: string; reason: string }) => regulatoryComplianceService.resolveGap(gapId, reason), onSuccess: invalidate }),
    createActionFoundation: useMutation({ mutationFn: ({ gapId, data }: { gapId: string; data?: Record<string, unknown> }) => regulatoryComplianceService.createActionFoundation(gapId, data), onSuccess: invalidate })
  };
}
