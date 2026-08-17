'use client';

import { useQuery } from '@tanstack/react-query';
import { miEquipmentService } from '../services/equipment.service';

export function useEquipmentHeader(id: string) {
  return useQuery({ queryKey: ['mechanical-integrity', 'equipment', id, 'header'], queryFn: () => miEquipmentService.header(id), retry: 1 });
}
