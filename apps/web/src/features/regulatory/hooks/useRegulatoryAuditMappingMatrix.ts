import { useQuery } from '@tanstack/react-query';
import { regulatoryAuditMappingService } from '../services/regulatory-audit-mapping.service';

export function useRegulatoryAuditMappingMatrix(params?: Record<string, unknown>) {
  return useQuery({ queryKey: ['regulatory', 'audit-mapping', 'matrix', params], queryFn: () => regulatoryAuditMappingService.matrix(params), refetchOnWindowFocus: false });
}
