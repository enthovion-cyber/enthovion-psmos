import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { hazopDashboardService } from '../services/hazop-dashboard.service';
import type { HazopDashboardFilters } from '../types/hazop-dashboard.types';

export function useHazopDashboard(filters?: Partial<HazopDashboardFilters>) {
  return useQuery({ queryKey: ['hazop', 'dashboard', filters], queryFn: hazopDashboardService.dashboard });
}

export function useHazopDashboardStudies(filters?: Partial<HazopDashboardFilters>) {
  const params = Object.fromEntries(Object.entries(filters ?? {}).filter(([, value]) => value !== '' && value !== false));
  return useQuery({ queryKey: ['hazop', 'dashboard', 'studies', params], queryFn: () => hazopDashboardService.studies(params) });
}

export function useHazopDashboardExport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: hazopDashboardService.export,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['hazop', 'dashboard'] });
    }
  });
}
