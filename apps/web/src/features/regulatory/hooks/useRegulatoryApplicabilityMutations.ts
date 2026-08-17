import { useMutation, useQueryClient } from '@tanstack/react-query';
import { regulatoryApplicabilityService } from '../services/regulatory-applicability.service';
import { regulatoryApplicabilityGapService } from '../services/regulatory-applicability-gap.service';
import { regulatoryApplicabilityProfileService } from '../services/regulatory-applicability-profile.service';

export function useRegulatoryApplicabilityMutations() {
  const queryClient = useQueryClient();
  const refresh = () => queryClient.invalidateQueries({ queryKey: ['regulatory'] });
  return {
    createAssessment: useMutation({ mutationFn: regulatoryApplicabilityService.create, onSuccess: refresh }),
    saveDecision: useMutation({ mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) => regulatoryApplicabilityService.saveDecision(id, data), onSuccess: refresh }),
    submitReview: useMutation({ mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) => regulatoryApplicabilityService.submitReview(id, data), onSuccess: refresh }),
    createProfile: useMutation({ mutationFn: regulatoryApplicabilityProfileService.create, onSuccess: refresh }),
    createGap: useMutation({ mutationFn: regulatoryApplicabilityGapService.create, onSuccess: refresh })
  };
}
