import { useQuery } from '@tanstack/react-query';
import { regulatoryLookupsService } from '../services/regulatory-lookups.service';

export function useRegulatoryLookups() {
  return useQuery({ queryKey: ['regulatory', 'lookups'], queryFn: regulatoryLookupsService.all, staleTime: 300000 });
}
