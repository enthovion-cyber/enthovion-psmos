import { useQuery } from '@tanstack/react-query';
import { executiveApi } from '../services/executive-api';

export function useExecutiveSourceHealth() {
  return useQuery({ queryKey: ['executive', 'source-health'], queryFn: executiveApi.sourceHealth, refetchOnWindowFocus: false });
}
