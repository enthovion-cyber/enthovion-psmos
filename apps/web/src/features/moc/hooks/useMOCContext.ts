import { useQuery } from '@tanstack/react-query';
import { mocService } from '../services/moc.service';

export function useMOCContext() {
  return useQuery({ queryKey: ['moc', 'new', 'context'], queryFn: mocService.context });
}

export function useMOCEquipmentSearch(search: string) {
  return useQuery({ queryKey: ['moc', 'equipment-search', search], queryFn: () => mocService.equipmentSearch(search), enabled: search.trim().length > 1 });
}
