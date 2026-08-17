import { useQuery } from '@tanstack/react-query';
import { regulatoryAuditMappingService } from '../services/regulatory-audit-mapping.service';

export function useRegulatoryAuditMappingDetail(mappingId?: string, section?: string) {
  return useQuery({
    queryKey: ['regulatory', 'audit-mapping', mappingId, section],
    enabled: Boolean(mappingId),
    queryFn: () => {
      if (!mappingId) throw new Error('Mapping ID is required.');
      return section ? regulatoryAuditMappingService.section(mappingId, section) : regulatoryAuditMappingService.detail(mappingId);
    },
    refetchOnWindowFocus: false
  });
}
