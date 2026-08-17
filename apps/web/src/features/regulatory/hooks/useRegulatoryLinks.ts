import { useQuery } from '@tanstack/react-query';
import { regulatoryLinkService } from '../services/regulatory-link.service';

export function useRegulatoryLinks(id?: string) {
  return useQuery({ queryKey: ['regulatory', 'links', id], queryFn: () => regulatoryLinkService.list(String(id)), enabled: Boolean(id) });
}
