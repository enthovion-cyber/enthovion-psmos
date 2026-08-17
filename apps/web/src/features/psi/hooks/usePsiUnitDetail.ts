import { useQuery } from '@tanstack/react-query';
import { psiUnitService } from '../services/psi-unit.service';

export function usePsiUnitDetail(unitId?: string) {
  return useQuery({ queryKey: ['psi', 'units', unitId], queryFn: () => psiUnitService.get(unitId as string), enabled: Boolean(unitId) });
}
