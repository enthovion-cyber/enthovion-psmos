'use client';

import { useQuery } from '@tanstack/react-query';
import { miEquipmentService } from '../services/equipment.service';

export function useEquipmentBlockers(id: string) {
  return useQuery({ queryKey: ['mechanical-integrity', 'equipment', id, 'blockers'], queryFn: () => miEquipmentService.blockers(id), retry: 1 });
}
