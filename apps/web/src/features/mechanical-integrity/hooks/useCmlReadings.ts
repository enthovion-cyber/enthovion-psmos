'use client';

import { useQuery } from '@tanstack/react-query';
import { miCmlService } from '../services/cml.service';

export function useCmlReadings(equipmentId: string, cmlId: string) {
  return useQuery({ queryKey: ['mechanical-integrity', 'equipment', equipmentId, 'cml', cmlId, 'readings'], queryFn: () => miCmlService.readings(equipmentId, cmlId), enabled: !!cmlId });
}
