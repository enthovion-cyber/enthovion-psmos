import { useQuery } from '@tanstack/react-query';
import { executiveApi } from '../services/executive-api';

export function useExecutivePerformanceDrilldown(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['executive', 'performance', 'drilldown', params],
    queryFn: () => executiveApi.performanceDrilldown(params),
    refetchOnWindowFocus: false,
  });
}
