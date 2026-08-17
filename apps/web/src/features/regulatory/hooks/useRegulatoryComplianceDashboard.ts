import { useQuery } from '@tanstack/react-query';
import { regulatoryComplianceService } from '../services/regulatory-compliance.service';

export function useRegulatoryComplianceDashboard(filters?: Record<string, unknown>) {
  return useQuery({ queryKey: ['regulatory', 'compliance', 'dashboard', filters], queryFn: () => regulatoryComplianceService.dashboard(filters), refetchOnWindowFocus: false });
}
