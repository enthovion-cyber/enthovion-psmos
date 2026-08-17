import { useQuery } from '@tanstack/react-query';
import { regulatoryAuditMappingService } from '../services/regulatory-audit-mapping.service';

export function useRegulatoryAuditMappingDashboard(params?: Record<string, unknown>) {
  return useQuery({ queryKey: ['regulatory', 'audit-mapping', 'dashboard', params], queryFn: () => regulatoryAuditMappingService.dashboard(params), refetchOnWindowFocus: false });
}
