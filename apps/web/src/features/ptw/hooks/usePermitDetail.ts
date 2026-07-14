import { useQuery } from '@tanstack/react-query';
import { ptwService } from '@/services/ptw.service';

export function usePermitDetail(id: string) {
  return useQuery({ queryKey: ['ptw', id], queryFn: () => ptwService.get(id), enabled: Boolean(id), refetchInterval: 30000 });
}

export function usePermitSummary(id: string) {
  return useQuery({ queryKey: ['ptw', id, 'summary'], queryFn: () => ptwService.summary(id), enabled: Boolean(id), refetchInterval: 30000 });
}
