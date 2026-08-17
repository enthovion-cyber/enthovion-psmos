import { useQuery } from '@tanstack/react-query';
import { regulatoryItemService } from '../services/regulatory-item.service';

export function useRegulatoryItem(id?: string) {
  return useQuery({ queryKey: ['regulatory', 'item', id], queryFn: () => regulatoryItemService.detail(String(id)), enabled: Boolean(id) });
}

export function useRegulatoryItemSection(id?: string, section?: string) {
  return useQuery({ queryKey: ['regulatory', 'item', id, section], queryFn: () => regulatoryItemService.section(String(id), String(section)), enabled: Boolean(id && section) });
}
