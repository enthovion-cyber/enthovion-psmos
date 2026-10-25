import { useQuery } from '@tanstack/react-query';
import { executiveApi } from '../services/executive-api';

export function useExecutiveKpiDetail(id: string, scope?: Record<string, unknown>) {
  return useQuery({ queryKey: ['executive', 'kpi', id, scope], queryFn: () => executiveApi.kpi(id, scope), enabled: Boolean(id), refetchOnWindowFocus: false });
}
