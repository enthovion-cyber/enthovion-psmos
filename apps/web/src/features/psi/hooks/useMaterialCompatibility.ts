import { useQuery } from '@tanstack/react-query';
import { materialCompatibilityService } from '../services/material-compatibility.service';

export function useMaterialCompatibility(params: Record<string, unknown> = {}, unitId?: string, equipmentId?: string, chemicalId?: string) {
  return useQuery({
    queryKey: ['psi', 'material-compatibility', unitId ?? null, equipmentId ?? null, chemicalId ?? null, params],
    queryFn: () => equipmentId ? materialCompatibilityService.equipmentRegistry(equipmentId, params) : chemicalId ? materialCompatibilityService.chemicalRegistry(chemicalId, params) : unitId ? materialCompatibilityService.unitRegistry(unitId, params) : materialCompatibilityService.registry(params)
  });
}

export function useMaterialCompatibilityLookups() {
  return useQuery({ queryKey: ['psi', 'material-compatibility-lookups'], queryFn: materialCompatibilityService.lookups, staleTime: 300000 });
}

