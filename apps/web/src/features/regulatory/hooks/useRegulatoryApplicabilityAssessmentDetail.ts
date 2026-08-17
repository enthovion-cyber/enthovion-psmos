import { useQuery } from '@tanstack/react-query';
import { regulatoryApplicabilityService } from '../services/regulatory-applicability.service';

export function useRegulatoryApplicabilityAssessmentDetail(id?: string) {
  return useQuery({ queryKey: ['regulatory', 'applicability', 'assessment', id], queryFn: () => regulatoryApplicabilityService.detail(id as string), enabled: Boolean(id), refetchOnWindowFocus: false });
}
