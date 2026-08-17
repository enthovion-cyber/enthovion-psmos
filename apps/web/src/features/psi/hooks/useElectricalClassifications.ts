import { useQuery } from '@tanstack/react-query';
import { electricalClassificationService } from '../services/electrical-classification.service';

export function useElectricalClassifications(params: Record<string, unknown> = {}, unitId?: string, areaId?: string, equipmentId?: string) {
  return useQuery({
    queryKey: ['psi', 'electrical-classifications', unitId ?? null, areaId ?? null, equipmentId ?? null, params],
    queryFn: () => equipmentId ? electricalClassificationService.equipmentRegistry(equipmentId, params) : areaId ? electricalClassificationService.areaRegistry(areaId, params) : unitId ? electricalClassificationService.unitRegistry(unitId, params) : electricalClassificationService.registry(params)
  });
}

export function useElectricalLookups() {
  return useQuery({ queryKey: ['psi', 'electrical-classification-lookups'], queryFn: electricalClassificationService.lookups, staleTime: 300000 });
}
