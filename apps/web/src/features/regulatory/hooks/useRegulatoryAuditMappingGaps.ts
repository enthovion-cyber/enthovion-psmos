import { useQuery } from '@tanstack/react-query';
import { regulatoryAuditMappingService } from '../services/regulatory-audit-mapping.service';

export function useRegulatoryAuditMappingGaps(params?: Record<string, unknown>) {
  return useQuery({ queryKey: ['regulatory', 'audit-mapping', 'gaps', params], queryFn: () => regulatoryAuditMappingService.gaps(params), refetchOnWindowFocus: false });
}
