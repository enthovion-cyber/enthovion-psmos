'use client';

import { useQuery } from '@tanstack/react-query';
import { inspectionOccurrenceService } from '../services/inspection-occurrence.service';

export function useInspectionOccurrences(planId: string) {
  return useQuery({ queryKey: ['mechanical-integrity', 'inspection-plan', planId, 'occurrences'], queryFn: () => inspectionOccurrenceService.list(planId) });
}
