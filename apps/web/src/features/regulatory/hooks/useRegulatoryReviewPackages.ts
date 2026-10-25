'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { regulatoryReviewService } from '../services/regulatory-review.service';

export function useRegulatoryReviewPackages(view: string = 'packages', filters?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['regulatory', 'review-approval', view, filters],
    queryFn: () => view === 'inbox' ? regulatoryReviewService.inbox(filters) : view === 'my-submissions' ? regulatoryReviewService.submissions(filters) : view === 'packages' ? regulatoryReviewService.register(filters) : regulatoryReviewService.filtered(view, filters),
    refetchOnWindowFocus: false
  });
}

export function useRegulatoryReviewPackageDetail(approvalId: string) {
  return useQuery({ queryKey: ['regulatory', 'review-approval', 'package', approvalId], queryFn: () => regulatoryReviewService.detail(approvalId), enabled: Boolean(approvalId), refetchOnWindowFocus: false });
}

export function useRegulatoryReviewMutations(approvalId?: string) {
  const client = useQueryClient();
  const invalidate = () => {
    client.invalidateQueries({ queryKey: ['regulatory', 'review-approval'] });
    if (approvalId) client.invalidateQueries({ queryKey: ['regulatory', 'review-approval', 'package', approvalId] });
  };
  return {
    submit: useMutation({ mutationFn: (data: Record<string, unknown>) => regulatoryReviewService.submit(String(approvalId), data), onSuccess: invalidate }),
    runValidation: useMutation({ mutationFn: (data: Record<string, unknown>) => regulatoryReviewService.runValidation(String(approvalId), data), onSuccess: invalidate }),
    approve: useMutation({ mutationFn: (data: Record<string, unknown>) => regulatoryReviewService.approve(String(approvalId), data), onSuccess: invalidate }),
    reject: useMutation({ mutationFn: (data: Record<string, unknown>) => regulatoryReviewService.reject(String(approvalId), data), onSuccess: invalidate }),
    returnForCorrection: useMutation({ mutationFn: (data: Record<string, unknown>) => regulatoryReviewService.returnForCorrection(String(approvalId), data), onSuccess: invalidate }),
    requestInfo: useMutation({ mutationFn: (data: Record<string, unknown>) => regulatoryReviewService.requestInfo(String(approvalId), data), onSuccess: invalidate }),
    eSign: useMutation({ mutationFn: (data: Record<string, unknown>) => regulatoryReviewService.eSign(String(approvalId), data), onSuccess: invalidate }),
    refreshSnapshot: useMutation({ mutationFn: (data: Record<string, unknown>) => regulatoryReviewService.refreshSnapshot(String(approvalId), data), onSuccess: invalidate })
  };
}
