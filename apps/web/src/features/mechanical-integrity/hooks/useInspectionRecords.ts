'use client';

import { useQuery } from '@tanstack/react-query';
import { inspectionRecordService } from '../services/inspection-record.service';

export function useInspectionRecords(filters: Record<string, unknown> = {}, equipmentId?: string) {
  return useQuery({
    queryKey: ['mechanical-integrity', 'inspection-records', equipmentId ?? 'all', filters],
    queryFn: () => equipmentId ? inspectionRecordService.equipmentRegistry(equipmentId, filters) : inspectionRecordService.registry(filters)
  });
}
