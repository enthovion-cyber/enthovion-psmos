'use client';

import { useQuery } from '@tanstack/react-query';
import { inspectionRecordService } from '../services/inspection-record.service';

export function useEquipmentRemainingLife(equipmentId: string) {
  return useQuery({
    queryKey: ['mechanical-integrity', 'remaining-life', equipmentId],
    queryFn: () => inspectionRecordService.equipmentRemainingLife(equipmentId),
    enabled: !!equipmentId
  });
}

export function useCmlRemainingLife(equipmentId: string, cmlId: string) {
  return useQuery({
    queryKey: ['mechanical-integrity', 'remaining-life', equipmentId, cmlId],
    queryFn: () => inspectionRecordService.cmlRemainingLife(equipmentId, cmlId),
    enabled: !!equipmentId && !!cmlId
  });
}
