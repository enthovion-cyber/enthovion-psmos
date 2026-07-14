import { useQuery } from '@tanstack/react-query';
import { pssrService } from '../services/pssr.service';

export function usePSSRDetail(id: string) {
  return useQuery({ queryKey: ['pssr', id, 'detail'], queryFn: () => pssrService.get(id), enabled: Boolean(id), refetchOnWindowFocus: false });
}

export function usePSSRTab(id: string, tab: string, queryFn: () => Promise<any>) {
  return useQuery({ queryKey: ['pssr', id, tab], queryFn, enabled: Boolean(id), refetchOnWindowFocus: false });
}
