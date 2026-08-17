import { useQuery } from '@tanstack/react-query';
import { psiCompletenessService } from '../services/psi-completeness.service';

export function usePsiCompleteness(unitId?: string) {
  return useQuery({ queryKey: ['psi', 'completeness', unitId], queryFn: () => psiCompletenessService.get(unitId as string), enabled: Boolean(unitId) });
}
