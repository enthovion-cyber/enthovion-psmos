import { useQuery } from '@tanstack/react-query';
import { regulatoryEvidenceService } from '../services/regulatory-evidence.service';

export function useRegulatoryEvidenceDashboard(filters?: Record<string, unknown>) {
  return useQuery({ queryKey: ['regulatory', 'evidence', 'dashboard', filters], queryFn: () => regulatoryEvidenceService.dashboard(filters), refetchOnWindowFocus: false });
}
