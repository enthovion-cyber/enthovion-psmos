import { useQuery } from '@tanstack/react-query';
import { regulatoryEvidenceService } from '../services/regulatory-evidence.service';

export function useRegulatoryEvidenceLookups() {
  return useQuery({ queryKey: ['regulatory', 'evidence', 'lookups'], queryFn: regulatoryEvidenceService.lookups, staleTime: 5 * 60 * 1000 });
}
