import { useQuery } from '@tanstack/react-query';
import { pssrPunchListService } from '../services/pssr-punch-list.service';

export function usePSSRPunchList(pssrId: string) {
  return useQuery({ queryKey: ['pssr', pssrId, 'punch-list'], queryFn: () => pssrPunchListService.get(pssrId), enabled: Boolean(pssrId), refetchOnWindowFocus: false });
}
