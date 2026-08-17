import { useQuery } from '@tanstack/react-query';
import { regulatoryApplicabilityGapService } from '../services/regulatory-applicability-gap.service';

export function useRegulatoryApplicabilityGaps(params?: Record<string, unknown>) {
  return useQuery({ queryKey: ['regulatory', 'applicability', 'gaps', params], queryFn: () => regulatoryApplicabilityGapService.list(params), refetchOnWindowFocus: false });
}
