import { useQuery } from '@tanstack/react-query';
import { regulatoryComplianceService } from '../services/regulatory-compliance.service';

export function useRegulatoryComplianceGaps(filters?: Record<string, unknown>) {
  return useQuery({ queryKey: ['regulatory', 'compliance', 'gaps', filters], queryFn: () => regulatoryComplianceService.gaps(filters), refetchOnWindowFocus: false });
}
