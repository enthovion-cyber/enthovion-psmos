import { useQuery } from '@tanstack/react-query';
import { equipmentDesignService } from '../services/equipment-design.service';

export function useEquipmentDesignBasis(filters: Record<string, unknown> = {}, unitId?: string | undefined, equipmentId?: string | undefined) {
  return useQuery({
    queryKey: ['psi', 'equipment-design', unitId ?? equipmentId ?? 'global', filters],
    queryFn: () => unitId ? equipmentDesignService.unitRegistry(unitId, filters) : equipmentId ? equipmentDesignService.equipmentRegistry(equipmentId, filters) : equipmentDesignService.registry(filters)
  });
}

export function useEquipmentDesignLookups() {
  return useQuery({ queryKey: ['psi', 'equipment-design-lookups'], queryFn: () => equipmentDesignService.lookups(), staleTime: 300_000 });
}
