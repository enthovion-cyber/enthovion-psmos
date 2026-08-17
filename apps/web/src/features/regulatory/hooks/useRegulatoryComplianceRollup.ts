import { useQuery } from '@tanstack/react-query';
import { regulatoryComplianceService } from '../services/regulatory-compliance.service';

export function useRegulatoryComplianceRollup(regulationId?: string) {
  return useQuery({ queryKey: ['regulatory', 'compliance', 'rollup', regulationId], queryFn: () => regulatoryComplianceService.rollup(regulationId as string), enabled: Boolean(regulationId), refetchOnWindowFocus: false });
}
