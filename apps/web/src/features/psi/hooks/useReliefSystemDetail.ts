import { useQuery } from '@tanstack/react-query';
import { reliefSystemService } from '../services/relief-system.service';

export function useReliefSystemDetail(reliefBasisId?: string | undefined) {
  return useQuery({
    queryKey: ['psi', 'relief-system', reliefBasisId],
    queryFn: () => reliefSystemService.detail(reliefBasisId as string),
    enabled: Boolean(reliefBasisId)
  });
}
