import { useQuery } from '@tanstack/react-query';
import { regulatoryApplicabilityService } from '../services/regulatory-applicability.service';

export function useRegulatoryApplicabilityAssessments(params?: Record<string, unknown>, view?: string) {
  return useQuery({ queryKey: ['regulatory', 'applicability', 'assessments', view ?? 'all', params], queryFn: () => view ? regulatoryApplicabilityService.filtered(view, params) : regulatoryApplicabilityService.assessments(params), refetchOnWindowFocus: false });
}
