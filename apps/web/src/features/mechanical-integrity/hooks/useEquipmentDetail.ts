'use client';

import { useQuery } from '@tanstack/react-query';
import { miEquipmentService } from '../services/equipment.service';

export function useEquipmentDetail(id: string) {
  return useQuery({ queryKey: ['mechanical-integrity', 'equipment', id], queryFn: () => miEquipmentService.get(id), retry: 1 });
}
