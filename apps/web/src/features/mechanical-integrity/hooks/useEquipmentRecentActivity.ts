'use client';

import { useQuery } from '@tanstack/react-query';
import { miEquipmentService } from '../services/equipment.service';

export function useEquipmentRecentActivity(id: string) {
  return useQuery({ queryKey: ['mechanical-integrity', 'equipment', id, 'recent-activity'], queryFn: () => miEquipmentService.recentActivity(id), retry: 1 });
}
