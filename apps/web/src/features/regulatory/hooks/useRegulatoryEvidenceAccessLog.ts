import { useQuery } from '@tanstack/react-query';
import { regulatoryEvidenceService } from '../services/regulatory-evidence.service';

export function useRegulatoryEvidenceAccessLog(filters?: Record<string, unknown>) {
  return useQuery({ queryKey: ['regulatory', 'evidence', 'access-log', filters], queryFn: () => regulatoryEvidenceService.accessLog(filters), refetchOnWindowFocus: false });
}
