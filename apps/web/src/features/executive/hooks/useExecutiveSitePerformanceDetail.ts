import { useQuery } from '@tanstack/react-query';
import { executiveApi } from '../services/executive-api';

export function useExecutiveSitePerformanceDetail(siteId: string, params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['executive', 'performance', 'site', siteId, params],
    queryFn: () => executiveApi.performanceScope('site', siteId, params),
    enabled: Boolean(siteId),
    refetchOnWindowFocus: false,
  });
}
