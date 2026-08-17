import { useQuery } from '@tanstack/react-query';
import { miHistoryService } from '../services/mi-history.service';

export function useEquipmentHistory(equipmentId?: string, params: Record<string, unknown> = {}) {
  return useQuery({ queryKey: ['mechanical-integrity', 'equipment-history', equipmentId, params], queryFn: () => miHistoryService.equipmentHistory(equipmentId as string, params), enabled: Boolean(equipmentId) });
}
