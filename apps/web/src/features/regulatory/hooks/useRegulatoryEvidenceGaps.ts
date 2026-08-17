import { useQuery } from '@tanstack/react-query';
import { regulatoryEvidenceService } from '../services/regulatory-evidence.service';

export function useRegulatoryEvidenceGaps(filters?: Record<string, unknown>) {
  return useQuery({ queryKey: ['regulatory', 'evidence', 'gaps', filters], queryFn: () => regulatoryEvidenceService.gaps(filters), refetchOnWindowFocus: false });
}
