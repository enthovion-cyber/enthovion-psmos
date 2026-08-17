import { useMutation, useQueryClient } from '@tanstack/react-query';
import { regulatoryEvidenceService } from '../services/regulatory-evidence.service';

export function useRegulatoryEvidenceMutations() {
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['regulatory', 'evidence'] });
  return {
    createRequirement: useMutation({ mutationFn: regulatoryEvidenceService.createRequirement, onSuccess: invalidate }),
    updateRequirement: useMutation({ mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) => regulatoryEvidenceService.updateRequirement(id, data), onSuccess: invalidate }),
    createLink: useMutation({ mutationFn: regulatoryEvidenceService.createLink, onSuccess: invalidate }),
    updateLink: useMutation({ mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) => regulatoryEvidenceService.updateLink(id, data), onSuccess: invalidate }),
    submitReview: useMutation({ mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) => regulatoryEvidenceService.submitReview(id, data), onSuccess: invalidate }),
    verify: useMutation({ mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) => regulatoryEvidenceService.verify(id, data), onSuccess: invalidate }),
    reject: useMutation({ mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) => regulatoryEvidenceService.reject(id, data), onSuccess: invalidate }),
    requestRework: useMutation({ mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) => regulatoryEvidenceService.requestRework(id, data), onSuccess: invalidate }),
    markStale: useMutation({ mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) => regulatoryEvidenceService.markStale(id, data), onSuccess: invalidate }),
    createRequest: useMutation({ mutationFn: regulatoryEvidenceService.createRequest, onSuccess: invalidate }),
    createGap: useMutation({ mutationFn: regulatoryEvidenceService.createGap, onSuccess: invalidate }),
    createPackage: useMutation({ mutationFn: regulatoryEvidenceService.createPackage, onSuccess: invalidate })
  };
}
