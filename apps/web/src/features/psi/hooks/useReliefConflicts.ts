import { useQuery } from '@tanstack/react-query';
import { reliefConflictService } from '../services/relief-conflict.service';

export function useReliefConflicts(reliefBasisId?: string | undefined) {
  return useQuery({ queryKey: ['psi', 'relief-conflicts', reliefBasisId], queryFn: () => reliefConflictService.list(reliefBasisId as string), enabled: Boolean(reliefBasisId) });
}
