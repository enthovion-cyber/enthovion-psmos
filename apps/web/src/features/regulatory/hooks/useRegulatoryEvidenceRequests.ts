import { useQuery } from '@tanstack/react-query';
import { regulatoryEvidenceService } from '../services/regulatory-evidence.service';

export function useRegulatoryEvidenceRequests(filters?: Record<string, unknown>) {
  return useQuery({ queryKey: ['regulatory', 'evidence', 'requests', filters], queryFn: () => regulatoryEvidenceService.requests(filters), refetchOnWindowFocus: false });
}
