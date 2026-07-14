'use client';

import { useQuery } from '@tanstack/react-query';
import { pssrDashboardService, type PSSRDashboardFilters } from '../services/pssr-dashboard.service';

export function usePSSRDashboard(filters: PSSRDashboardFilters) {
  return useQuery({
    queryKey: ['pssr', 'dashboard', filters],
    queryFn: () => pssrDashboardService.dashboard(filters),
    refetchInterval: 30000,
    refetchOnWindowFocus: false
  });
}
