import { useQuery } from '@tanstack/react-query';
import { impairmentService } from '../services/impairment.service';

export function useImpairmentDetail(impairmentId?: string) {
  return useQuery({ queryKey: ['mechanical-integrity', 'impairment', impairmentId], queryFn: () => impairmentService.get(impairmentId as string), enabled: Boolean(impairmentId) });
}
