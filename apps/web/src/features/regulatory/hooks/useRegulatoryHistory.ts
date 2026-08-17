import { useQuery } from '@tanstack/react-query';
import { regulatoryHistoryService } from '../services/regulatory-history.service';

export function useRegulatoryHistory(filters?: Record<string, unknown>) {
  return useQuery({ queryKey: ['regulatory', 'history', filters], queryFn: () => regulatoryHistoryService.list(filters), refetchOnWindowFocus: false });
}

export function useRegulatoryItemHistory(id?: string) {
  return useQuery({ queryKey: ['regulatory', 'history', id], queryFn: () => regulatoryHistoryService.item(String(id)), enabled: Boolean(id) });
}
