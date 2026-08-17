'use client';

import { useQuery } from '@tanstack/react-query';
import { miEquipmentService, type MiEquipmentFilters } from '../services/equipment.service';

export function useEquipmentRegistry(filters: MiEquipmentFilters) {
  return useQuery({ queryKey: ['mechanical-integrity', 'equipment', filters], queryFn: () => miEquipmentService.registry(filters) });
}
