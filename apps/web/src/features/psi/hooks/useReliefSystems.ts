import { useQuery } from '@tanstack/react-query';
import { reliefSystemService } from '../services/relief-system.service';

export function useReliefSystems(filters: Record<string, unknown> = {}, unitId?: string | undefined, equipmentId?: string | undefined) {
  return useQuery({
    queryKey: ['psi', 'relief-systems', unitId ?? equipmentId ?? 'global', filters],
    queryFn: () => unitId ? reliefSystemService.unitRegistry(unitId, filters) : equipmentId ? reliefSystemService.equipmentRegistry(equipmentId, filters) : reliefSystemService.registry(filters)
  });
}

export function useReliefSystemLookups() {
  return useQuery({ queryKey: ['psi', 'relief-system-lookups'], queryFn: () => reliefSystemService.lookups(), staleTime: 300_000 });
}
