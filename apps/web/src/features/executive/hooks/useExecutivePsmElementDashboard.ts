'use client';

import { useQuery } from '@tanstack/react-query';
import { executivePsmElementApi } from '../services/executive-psm-element.service';

export function useExecutivePsmElementDashboard(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['executive', 'psm-elements', 'dashboard', params],
    queryFn: () => executivePsmElementApi.dashboard(params),
    refetchOnWindowFocus: false,
  });
}
