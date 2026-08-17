import { useQuery } from '@tanstack/react-query';
import { psiUnitService } from '../services/psi-unit.service';

export function usePsiUnits(filters: Record<string, unknown> = {}) {
  return useQuery({ queryKey: ['psi', 'units', filters], queryFn: () => psiUnitService.units(filters) });
}

export function usePsiUnitLookups() {
  return useQuery({ queryKey: ['psi', 'lookups'], queryFn: () => psiUnitService.lookups(), staleTime: 300_000 });
}
