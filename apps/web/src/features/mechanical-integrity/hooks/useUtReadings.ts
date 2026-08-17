'use client';

import { useQuery } from '@tanstack/react-query';
import { inspectionRecordService } from '../services/inspection-record.service';

export function useCmlInspectionReadings(equipmentId: string, cmlId: string) {
  return useQuery({
    queryKey: ['mechanical-integrity', 'ut-readings', equipmentId, cmlId],
    queryFn: () => inspectionRecordService.cmlReadings(equipmentId, cmlId),
    enabled: !!equipmentId && !!cmlId
  });
}
