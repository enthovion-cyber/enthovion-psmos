import { useQuery } from '@tanstack/react-query';
import { lopaDetailService } from '../services/lopa-detail.service';

export function useLopaStudy(id: string) {
  return useQuery({ queryKey: ['lopa', 'detail', id], queryFn: () => lopaDetailService.get(id), enabled: !!id });
}
