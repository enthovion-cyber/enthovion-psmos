import { useMutation, useQueryClient } from '@tanstack/react-query';
import { competencyProfileService } from '../services/competency-profile.service';

export function useCompetencyProfileMutations(profileId?: string) {
  const qc = useQueryClient();
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['competency-profiles'] });
    qc.invalidateQueries({ queryKey: ['competency-dashboard'] });
    if (profileId) qc.invalidateQueries({ queryKey: ['competency-profile', profileId] });
  };
  return {
    create: useMutation({ mutationFn: competencyProfileService.createProfile, onSuccess: invalidate }),
    update: useMutation({ mutationFn: (data: Record<string, unknown>) => competencyProfileService.updateProfile(profileId ?? '', data), onSuccess: invalidate }),
    activate: useMutation({ mutationFn: () => competencyProfileService.activateProfile(profileId ?? ''), onSuccess: invalidate }),
    submitReview: useMutation({ mutationFn: (data?: Record<string, unknown>) => competencyProfileService.submitReview(profileId ?? '', data), onSuccess: invalidate }),
    approve: useMutation({ mutationFn: (data?: Record<string, unknown>) => competencyProfileService.approve(profileId ?? '', data), onSuccess: invalidate }),
    syncToMatrix: useMutation({ mutationFn: () => competencyProfileService.syncToMatrix(profileId ?? ''), onSuccess: invalidate })
  };
}
