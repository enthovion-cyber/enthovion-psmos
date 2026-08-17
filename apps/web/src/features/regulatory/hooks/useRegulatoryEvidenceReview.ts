import { useQuery } from '@tanstack/react-query';
import { regulatoryEvidenceService } from '../services/regulatory-evidence.service';

export function useRegulatoryEvidenceReview(filters?: Record<string, unknown>) {
  return useQuery({ queryKey: ['regulatory', 'evidence', 'review', filters], queryFn: () => regulatoryEvidenceService.reviews(filters), refetchOnWindowFocus: false });
}
