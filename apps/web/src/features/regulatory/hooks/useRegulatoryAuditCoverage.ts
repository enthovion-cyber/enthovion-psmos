import { useQuery } from '@tanstack/react-query';
import { regulatoryAuditMappingService } from '../services/regulatory-audit-mapping.service';

export function useRegulatoryAuditCoverage(params?: Record<string, unknown>) {
  return useQuery({ queryKey: ['regulatory', 'audit-mapping', 'coverage', params], queryFn: () => regulatoryAuditMappingService.coverage(params), refetchOnWindowFocus: false });
}
