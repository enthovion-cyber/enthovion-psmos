import { useQuery } from '@tanstack/react-query';
import { regulatoryComplianceService } from '../services/regulatory-compliance.service';

export function useRegulatoryComplianceAssessmentDetail(assessmentId?: string) {
  return useQuery({ queryKey: ['regulatory', 'compliance', 'assessment', assessmentId], queryFn: () => regulatoryComplianceService.detail(assessmentId as string), enabled: Boolean(assessmentId), refetchOnWindowFocus: false });
}
