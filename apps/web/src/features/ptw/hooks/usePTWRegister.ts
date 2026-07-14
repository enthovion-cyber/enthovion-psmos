import { useQuery } from '@tanstack/react-query';
import { ptwDashboardService, type PTWRegisterFilters } from '../services/ptw-dashboard.service';

export function usePTWRegister(filters: PTWRegisterFilters) {
  return useQuery({
    queryKey: ['ptw', 'register', filters],
    queryFn: () => ptwDashboardService.register(filters),
    refetchInterval: 30000
  });
}
