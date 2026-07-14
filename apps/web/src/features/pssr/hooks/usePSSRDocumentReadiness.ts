import { useQuery } from '@tanstack/react-query';
import { pssrDocumentReadinessService } from '../services/pssr-document-readiness.service';

export function usePSSRDocumentReadiness(pssrId: string) {
  return useQuery({ queryKey: ['pssr', pssrId, 'document-readiness'], queryFn: () => pssrDocumentReadinessService.get(pssrId), enabled: Boolean(pssrId), refetchOnWindowFocus: false });
}
