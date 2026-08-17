'use client';

import { useQuery } from '@tanstack/react-query';
import { inspectionRecordService } from '../services/inspection-record.service';

export function useInspectionRecordDetail(inspectionId: string) {
  return useQuery({
    queryKey: ['mechanical-integrity', 'inspection-record', inspectionId],
    queryFn: () => inspectionRecordService.get(inspectionId),
    enabled: !!inspectionId
  });
}
