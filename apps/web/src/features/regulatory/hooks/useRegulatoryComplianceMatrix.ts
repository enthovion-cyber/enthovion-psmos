import { useQuery } from '@tanstack/react-query';
import { regulatoryComplianceService } from '../services/regulatory-compliance.service';

export function useRegulatoryComplianceMatrix(filters?: Record<string, unknown>) {
  return useQuery({ queryKey: ['regulatory', 'compliance', 'matrix', filters], queryFn: () => regulatoryComplianceService.matrix(filters), refetchOnWindowFocus: false });
}
