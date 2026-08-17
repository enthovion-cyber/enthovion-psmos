import { useQuery } from '@tanstack/react-query';
import { regulatoryApplicabilityService } from '../services/regulatory-applicability.service';

export function useRegulatoryApplicabilityDashboard(params?: Record<string, unknown>) {
  return useQuery({ queryKey: ['regulatory', 'applicability', 'dashboard', params], queryFn: () => regulatoryApplicabilityService.dashboard(params), refetchOnWindowFocus: false });
}
