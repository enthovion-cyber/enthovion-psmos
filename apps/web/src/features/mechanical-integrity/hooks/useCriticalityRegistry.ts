'use client';

import { useQuery } from '@tanstack/react-query';
import { criticalityService } from '../services/criticality.service';

export function useCriticalityRegistry(filters: Record<string, string | number | undefined> = {}) {
  return useQuery({ queryKey: ['mechanical-integrity', 'criticality', filters], queryFn: () => criticalityService.registry(filters) });
}
