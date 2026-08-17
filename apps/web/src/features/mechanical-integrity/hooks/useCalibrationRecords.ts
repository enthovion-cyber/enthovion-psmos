import { useQuery } from '@tanstack/react-query';
import { calibrationRecordService } from '../services/calibration-record.service';

export function useCalibrationRecords(filters: Record<string, unknown> = {}, equipmentId?: string) {
  return useQuery({ queryKey: ['mechanical-integrity', 'calibration-records', equipmentId ?? 'all', filters], queryFn: () => calibrationRecordService.registry(filters, equipmentId) });
}

export function useCalibrationRecord(recordId?: string) {
  return useQuery({ queryKey: ['mechanical-integrity', 'calibration-record', recordId], queryFn: () => calibrationRecordService.get(recordId!), enabled: !!recordId });
}

