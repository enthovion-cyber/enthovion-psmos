'use client';

import { useQuery } from '@tanstack/react-query';
import { miEquipmentService } from '../services/equipment.service';

export function useEquipmentLookups() {
  return useQuery({ queryKey: ['mechanical-integrity', 'lookups'], queryFn: () => miEquipmentService.lookups() });
}
