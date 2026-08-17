import { useQuery } from '@tanstack/react-query';
import { regulatoryAuthorityService } from '../services/regulatory-authority.service';

export function useRegulatoryAuthorities(params?: Record<string, unknown>) {
  return useQuery({ queryKey: ['regulatory', 'authorities', params], queryFn: () => regulatoryAuthorityService.list(params), refetchOnWindowFocus: false });
}
