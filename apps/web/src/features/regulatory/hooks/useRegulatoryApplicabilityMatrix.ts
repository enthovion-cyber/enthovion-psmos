import { useQuery } from '@tanstack/react-query';
import { regulatoryApplicabilityService } from '../services/regulatory-applicability.service';

export function useRegulatoryApplicabilityMatrix(params?: Record<string, unknown>) {
  return useQuery({ queryKey: ['regulatory', 'applicability', 'matrix', params], queryFn: () => regulatoryApplicabilityService.matrix(params), refetchOnWindowFocus: false });
}
