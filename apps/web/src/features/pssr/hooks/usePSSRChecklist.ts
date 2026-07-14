import { useQuery } from '@tanstack/react-query';
import { pssrChecklistService } from '../services/pssr-checklist.service';

export function usePSSRChecklist(pssrId: string) {
  return useQuery({ queryKey: ['pssr', pssrId, 'checklist'], queryFn: () => pssrChecklistService.get(pssrId), enabled: Boolean(pssrId), refetchOnWindowFocus: false });
}
