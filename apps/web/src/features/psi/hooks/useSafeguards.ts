import { useQuery } from '@tanstack/react-query';
import { safeguardService } from '../services/safeguard.service';

export function useSafeguards(params: Record<string, unknown> = {}, unitId?: string, equipmentId?: string) {
  return useQuery({
    queryKey: ['psi', 'safeguards', unitId ?? null, equipmentId ?? null, params],
    queryFn: () => equipmentId ? safeguardService.equipmentRegistry(equipmentId, params) : unitId ? safeguardService.unitRegistry(unitId, params) : safeguardService.registry(params)
  });
}

export function useSafeguardLookups() {
  return useQuery({ queryKey: ['psi', 'safeguard-lookups'], queryFn: safeguardService.lookups, staleTime: 300000 });
}
