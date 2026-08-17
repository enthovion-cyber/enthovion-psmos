'use client';

import { useQuery } from '@tanstack/react-query';
import { miCmlService } from '../services/cml.service';

export function useCmlCalculation(equipmentId: string, cmlId: string) {
  return useQuery({ queryKey: ['mechanical-integrity', 'equipment', equipmentId, 'cml', cmlId, 'calculation'], queryFn: () => miCmlService.calculation(equipmentId, cmlId), enabled: !!cmlId });
}
