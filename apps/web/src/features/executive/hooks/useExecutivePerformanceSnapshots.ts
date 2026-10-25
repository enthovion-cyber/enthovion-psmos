import { useQuery } from '@tanstack/react-query';
import { executiveApi } from '../services/executive-api';

export function useExecutivePerformanceSnapshots(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['executive', 'performance', 'snapshots', params],
    queryFn: () => executiveApi.performanceSnapshots(params),
    refetchOnWindowFocus: false,
  });
}
