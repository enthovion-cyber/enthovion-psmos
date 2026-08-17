import { useQuery } from '@tanstack/react-query';
import { competencyProfileService } from '../services/competency-profile.service';

export function useCompetencyProfiles(params?: Record<string, unknown>) {
  return useQuery({ queryKey: ['competency-profiles', params], queryFn: () => competencyProfileService.profiles(params) });
}
