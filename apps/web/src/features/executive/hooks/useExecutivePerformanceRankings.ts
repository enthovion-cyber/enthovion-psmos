import { useQuery } from '@tanstack/react-query';
import { executiveApi } from '../services/executive-api';

export function useExecutivePerformanceRankings(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['executive', 'performance', 'rankings', params],
    queryFn: () => executiveApi.performanceRankings(params),
    refetchOnWindowFocus: false,
  });
}
