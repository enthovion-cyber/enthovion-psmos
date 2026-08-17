'use client';

import { useQuery } from '@tanstack/react-query';
import { miDashboardService } from '../services/mi-dashboard.service';

export function useMiDashboard() {
  return useQuery({ queryKey: ['mechanical-integrity', 'dashboard'], queryFn: () => miDashboardService.get() });
}
