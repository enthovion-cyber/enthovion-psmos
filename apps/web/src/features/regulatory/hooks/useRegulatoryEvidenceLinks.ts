import { useQuery } from '@tanstack/react-query';
import { regulatoryEvidenceService } from '../services/regulatory-evidence.service';

export function useRegulatoryEvidenceLinks(filters?: Record<string, unknown>, view?: string) {
  return useQuery({ queryKey: ['regulatory', 'evidence', view ?? 'links', filters], queryFn: () => view ? regulatoryEvidenceService.filtered(view, filters) : regulatoryEvidenceService.links(filters), refetchOnWindowFocus: false });
}
