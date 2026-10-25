import { useQuery } from '@tanstack/react-query';
import { executiveApi } from '../services/executive-api';

export function useExecutiveUnitPerformanceDetail(unitId: string, params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['executive', 'performance', 'unit', unitId, params],
    queryFn: () => executiveApi.performanceScope('unit', unitId, params),
    enabled: Boolean(unitId),
    refetchOnWindowFocus: false,
  });
}
