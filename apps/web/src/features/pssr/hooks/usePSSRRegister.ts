'use client';

import { useQuery } from '@tanstack/react-query';
import { pssrService } from '../services/pssr.service';
import type { PSSRDashboardFilters } from '../services/pssr-dashboard.service';

export function usePSSRRegister(filters: PSSRDashboardFilters) {
  return useQuery({
    queryKey: ['pssr', 'register', filters],
    queryFn: () => pssrService.list(filters),
    refetchOnWindowFocus: false
  });
}
