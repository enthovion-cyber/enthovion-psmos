'use client';

import { useQuery } from '@tanstack/react-query';
import { miCmlService } from '../services/cml.service';

export function useCmlDetail(equipmentId: string, cmlId?: string) {
  return useQuery({
    queryKey: ['mechanical-integrity', 'equipment', equipmentId, 'cml', cmlId],
    queryFn: () => miCmlService.get(equipmentId, cmlId!),
    enabled: !!cmlId
  });
}
