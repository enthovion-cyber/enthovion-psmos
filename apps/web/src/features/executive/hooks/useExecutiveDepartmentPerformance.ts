import { useQuery } from '@tanstack/react-query';
import { executiveApi } from '../services/executive-api';

export function useExecutiveDepartmentPerformance(departmentId?: string, params?: Record<string, unknown>) {
  return useQuery<any>({
    queryKey: ['executive', 'performance', 'department', departmentId, params],
    queryFn: () => (departmentId ? executiveApi.performanceScope('department', departmentId, params) : executiveApi.performanceScopes('department', params)),
    refetchOnWindowFocus: false,
  });
}
