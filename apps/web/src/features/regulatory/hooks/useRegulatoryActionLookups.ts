import { useQuery } from '@tanstack/react-query';
import { regulatoryActionService } from '../services/regulatory-action.service';

export function useRegulatoryActionLookups() {
  return useQuery({ queryKey: ['regulatory', 'actions', 'lookups'], queryFn: () => regulatoryActionService.lookups(), staleTime: 300000, refetchOnWindowFocus: false });
}
