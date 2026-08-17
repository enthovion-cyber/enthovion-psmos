'use client';

import { useQuery } from '@tanstack/react-query';
import { criticalityService } from '../services/criticality.service';

export function useEquipmentCriticality(equipmentId: string) {
  return useQuery({ queryKey: ['mechanical-integrity', 'equipment-criticality', equipmentId], queryFn: () => criticalityService.equipment(equipmentId), enabled: !!equipmentId });
}
