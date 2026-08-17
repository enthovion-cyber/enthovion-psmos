'use client';

import { useQuery } from '@tanstack/react-query';
import { inspectionOccurrenceService } from '../services/inspection-occurrence.service';
import { inspectionSchedulerService } from '../services/inspection-scheduler.service';

export function useInspectionPlanSchedule(planId: string) {
  const evaluations = useQuery({ queryKey: ['mechanical-integrity', 'inspection-plan', planId, 'evaluations'], queryFn: () => inspectionSchedulerService.evaluations(planId) });
  const occurrences = useQuery({ queryKey: ['mechanical-integrity', 'inspection-plan', planId, 'occurrences'], queryFn: () => inspectionOccurrenceService.list(planId) });
  return { evaluations, occurrences };
}
