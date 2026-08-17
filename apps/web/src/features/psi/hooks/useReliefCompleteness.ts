import { useQuery } from '@tanstack/react-query';
import { reliefCompletenessService } from '../services/relief-completeness.service';

export function useReliefCompleteness(reliefBasisId?: string | undefined) {
  return useQuery({ queryKey: ['psi', 'relief-completeness', reliefBasisId], queryFn: () => reliefCompletenessService.list(reliefBasisId as string), enabled: Boolean(reliefBasisId) });
}
