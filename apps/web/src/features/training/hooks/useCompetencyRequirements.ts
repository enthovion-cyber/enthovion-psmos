import { useQuery } from '@tanstack/react-query';
import { competencyProfileService } from '../services/competency-profile.service';

export function useCompetencyRequirements(profileId: string) {
  return useQuery({ queryKey: ['competency-requirements', profileId], queryFn: () => competencyProfileService.requirements(profileId), enabled: Boolean(profileId) });
}
