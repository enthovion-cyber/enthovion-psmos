import { useQuery } from '@tanstack/react-query';
import { executiveApi } from '../services/executive-api';

export function useExecutivePerformanceDashboard(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['executive', 'performance', 'dashboard', params],
    queryFn: () => executiveApi.performanceDashboard(params),
    refetchOnWindowFocus: false,
  });
}
