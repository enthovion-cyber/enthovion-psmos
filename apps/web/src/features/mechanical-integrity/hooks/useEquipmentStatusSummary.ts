'use client';

import { useQuery } from '@tanstack/react-query';
import { miEquipmentService } from '../services/equipment.service';

export function useEquipmentStatusSummary(id: string) {
  return useQuery({ queryKey: ['mechanical-integrity', 'equipment', id, 'status-summary'], queryFn: () => miEquipmentService.statusSummary(id), retry: 1 });
}
