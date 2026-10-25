import { useQuery } from '@tanstack/react-query';
import { executiveApi } from '../services/executive-api';

export function useExecutiveSitePerformance(scope?: Record<string, unknown>) {
  return useQuery({ queryKey: ['executive', 'sites', scope], queryFn: () => executiveApi.sites(scope), refetchOnWindowFocus: false });
}
