'use client';

import { useQuery } from '@tanstack/react-query';
import { miCmlService } from '../services/cml.service';

export function useCmlRegistry(equipmentId: string, filters: Record<string, unknown> = {}) {
  return useQuery({
    queryKey: ['mechanical-integrity', 'equipment', equipmentId, 'cmls', filters],
    queryFn: () => miCmlService.registry(equipmentId, filters)
  });
}
