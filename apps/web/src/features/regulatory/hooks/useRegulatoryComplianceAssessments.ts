import { useQuery } from '@tanstack/react-query';
import { regulatoryComplianceService } from '../services/regulatory-compliance.service';

export function useRegulatoryComplianceAssessments(filters?: Record<string, unknown>, view?: string) {
  return useQuery({ queryKey: ['regulatory', 'compliance', view ?? 'register', filters], queryFn: () => view ? regulatoryComplianceService.filtered(view, filters) : regulatoryComplianceService.register(filters), refetchOnWindowFocus: false });
}
