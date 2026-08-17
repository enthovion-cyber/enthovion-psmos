import { useQuery } from '@tanstack/react-query';
import { miLinkedRecordService } from '../services/linked-record.service';

export function useLinkedRecords(params: Record<string, unknown> = {}) {
  return useQuery({ queryKey: ['mechanical-integrity', 'linked-records', params], queryFn: () => miLinkedRecordService.list(params) });
}

export function useEquipmentLinkedRecords(equipmentId?: string, params: Record<string, unknown> = {}) {
  return useQuery({ queryKey: ['mechanical-integrity', 'equipment-linked-records', equipmentId, params], queryFn: () => miLinkedRecordService.equipment(equipmentId as string, params), enabled: Boolean(equipmentId) });
}

export function useLinkedRecordLookups() {
  return useQuery({ queryKey: ['mechanical-integrity', 'linked-record-lookups'], queryFn: miLinkedRecordService.lookups });
}
