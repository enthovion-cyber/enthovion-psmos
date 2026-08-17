import { useQuery } from '@tanstack/react-query';
import { safeOperatingLimitService } from '../services/safe-operating-limit.service';

export function useSafeOperatingLimits(filters: Record<string, unknown> = {}, unitId?: string | undefined, equipmentId?: string | undefined) {
  return useQuery({
    queryKey: ['psi', 'safe-operating-limits', unitId ?? equipmentId ?? 'global', filters],
    queryFn: () => unitId ? safeOperatingLimitService.unitRegistry(unitId, filters) : equipmentId ? safeOperatingLimitService.equipmentRegistry(equipmentId, filters) : safeOperatingLimitService.registry(filters)
  });
}

export function useSafeOperatingLimitLookups() {
  return useQuery({ queryKey: ['psi', 'safe-operating-limit-lookups'], queryFn: () => safeOperatingLimitService.lookups(), staleTime: 300_000 });
}
