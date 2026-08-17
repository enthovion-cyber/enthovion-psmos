import { useQuery } from '@tanstack/react-query';
import { regulatoryAuditMappingService } from '../services/regulatory-audit-mapping.service';

export function useRegulatoryAuditMappingLookups() {
  return useQuery({ queryKey: ['regulatory', 'audit-mapping', 'lookups'], queryFn: () => regulatoryAuditMappingService.lookups(), staleTime: 5 * 60 * 1000 });
}
