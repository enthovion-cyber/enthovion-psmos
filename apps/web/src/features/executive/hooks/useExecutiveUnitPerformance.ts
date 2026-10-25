import { useQuery } from '@tanstack/react-query';
import { executiveApi } from '../services/executive-api';

export function useExecutiveUnitPerformance(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['executive', 'performance', 'units', params],
    queryFn: () => executiveApi.performanceScopes('unit', params),
    refetchOnWindowFocus: false,
  });
}
