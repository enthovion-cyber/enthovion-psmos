import { useQuery } from '@tanstack/react-query';
import { pmRecordService } from '../services/pm-record.service';

export function usePmRecords(filters: Record<string, unknown> = {}, equipmentId?: string) {
  return useQuery({ queryKey: ['mechanical-integrity', 'pm-records', equipmentId ?? 'all', filters], queryFn: () => pmRecordService.registry(filters, equipmentId) });
}

export function usePmRecord(recordId?: string) {
  return useQuery({ queryKey: ['mechanical-integrity', 'pm-record', recordId], queryFn: () => pmRecordService.get(recordId!), enabled: !!recordId });
}

