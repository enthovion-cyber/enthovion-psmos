import { useQuery } from '@tanstack/react-query';
import { regulatoryComplianceService } from '../services/regulatory-compliance.service';

export function useRegulatoryComplianceLookups() {
  return useQuery({ queryKey: ['regulatory', 'compliance', 'lookups'], queryFn: () => regulatoryComplianceService.lookups(), staleTime: 15 * 60_000 });
}
