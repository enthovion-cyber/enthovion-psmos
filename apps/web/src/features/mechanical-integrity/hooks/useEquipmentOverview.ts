'use client';

import { useQuery } from '@tanstack/react-query';
import { miEquipmentService } from '../services/equipment.service';

export function useEquipmentOverview(id: string) {
  return useQuery({ queryKey: ['mechanical-integrity', 'equipment', id, 'overview'], queryFn: () => miEquipmentService.overview(id), retry: 1 });
}
