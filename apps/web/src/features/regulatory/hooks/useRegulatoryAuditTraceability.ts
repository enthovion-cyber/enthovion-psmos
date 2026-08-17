import { useQuery } from '@tanstack/react-query';
import { regulatoryAuditMappingService } from '../services/regulatory-audit-mapping.service';

export function useRegulatoryAuditTraceability(params?: Record<string, unknown>) {
  return useQuery({ queryKey: ['regulatory', 'audit-mapping', 'traceability', params], queryFn: () => regulatoryAuditMappingService.traceability(params), refetchOnWindowFocus: false });
}
