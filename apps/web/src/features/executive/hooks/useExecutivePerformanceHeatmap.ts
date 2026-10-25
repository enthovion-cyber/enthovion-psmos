import { useQuery } from '@tanstack/react-query';
import { executiveApi } from '../services/executive-api';

export function useExecutivePerformanceHeatmap(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['executive', 'performance', 'heatmap', params],
    queryFn: () => executiveApi.performanceHeatmap(params),
    refetchOnWindowFocus: false,
  });
}
