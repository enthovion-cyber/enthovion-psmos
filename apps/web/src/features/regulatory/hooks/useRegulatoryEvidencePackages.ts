import { useQuery } from '@tanstack/react-query';
import { regulatoryEvidenceService } from '../services/regulatory-evidence.service';

export function useRegulatoryEvidencePackages(filters?: Record<string, unknown>) {
  return useQuery({ queryKey: ['regulatory', 'evidence', 'packages', filters], queryFn: () => regulatoryEvidenceService.packages(filters), refetchOnWindowFocus: false });
}
