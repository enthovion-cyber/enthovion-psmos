import { useQuery } from '@tanstack/react-query';
import { regulatoryEvidenceService } from '../services/regulatory-evidence.service';

export function useRegulatoryEvidenceRequirements(filters?: Record<string, unknown>) {
  return useQuery({ queryKey: ['regulatory', 'evidence', 'requirements', filters], queryFn: () => regulatoryEvidenceService.requirements(filters), refetchOnWindowFocus: false });
}
