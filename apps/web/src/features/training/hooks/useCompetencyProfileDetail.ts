import { useQuery } from '@tanstack/react-query';
import { competencyProfileService } from '../services/competency-profile.service';

export function useCompetencyProfileDetail(profileId: string) {
  return useQuery({ queryKey: ['competency-profile', profileId], queryFn: () => competencyProfileService.profile(profileId), enabled: Boolean(profileId) });
}
