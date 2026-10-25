import { useQuery } from '@tanstack/react-query';
import { executiveApi } from '../services/executive-api';

export function useExecutiveCompanyPerformance(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['executive', 'performance', 'company', params],
    queryFn: () => executiveApi.performanceCompany(params),
    refetchOnWindowFocus: false,
  });
}
