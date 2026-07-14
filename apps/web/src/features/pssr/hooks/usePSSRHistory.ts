import { useQuery } from '@tanstack/react-query';
import { pssrHistoryService } from '../services/pssr-history.service';

export function usePSSRHistory(pssrId: string, filters?: Record<string, any>) {
  return useQuery({ queryKey: ['pssr', pssrId, 'history', filters], queryFn: () => pssrHistoryService.get(pssrId, filters), enabled: Boolean(pssrId), refetchOnWindowFocus: false });
}
