import { useQuery } from '@tanstack/react-query';
import { regulatoryEvidenceService } from '../services/regulatory-evidence.service';

export function useRegulatoryEvidenceLinkDetail(evidenceLinkId: string) {
  return useQuery({ queryKey: ['regulatory', 'evidence', 'link', evidenceLinkId], queryFn: () => regulatoryEvidenceService.link(evidenceLinkId), enabled: Boolean(evidenceLinkId), refetchOnWindowFocus: false });
}
