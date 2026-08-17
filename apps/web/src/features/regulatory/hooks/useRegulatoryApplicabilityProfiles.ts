import { useQuery } from '@tanstack/react-query';
import { regulatoryApplicabilityProfileService } from '../services/regulatory-applicability-profile.service';

export function useRegulatoryApplicabilityProfiles(params?: Record<string, unknown>) {
  return useQuery({ queryKey: ['regulatory', 'applicability', 'profiles', params], queryFn: () => regulatoryApplicabilityProfileService.list(params), refetchOnWindowFocus: false });
}
