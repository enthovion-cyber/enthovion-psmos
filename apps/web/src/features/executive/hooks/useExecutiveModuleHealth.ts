import { useQuery } from '@tanstack/react-query';
import { executiveApi } from '../services/executive-api';

export function useExecutiveModuleHealth(scope?: Record<string, unknown>) {
  return useQuery({ queryKey: ['executive', 'modules', scope], queryFn: () => executiveApi.modules(scope), refetchOnWindowFocus: false });
}
