'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { inspectionSchedulerService } from '../services/inspection-scheduler.service';

export function useInspectionScheduler() {
  const qc = useQueryClient();
  const runs = useQuery({ queryKey: ['mechanical-integrity', 'inspection-scheduler', 'runs'], queryFn: () => inspectionSchedulerService.runs() });
  const run = useMutation({ mutationFn: (input: Record<string, unknown>) => inspectionSchedulerService.run(input), onSuccess: () => qc.invalidateQueries({ queryKey: ['mechanical-integrity'] }) });
  return { runs, run };
}
