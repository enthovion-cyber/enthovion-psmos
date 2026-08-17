'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { inspectionPlanImportService } from '../services/inspection-plan-import.service';

export function useInspectionPlanImport() {
  const qc = useQueryClient();
  return {
    create: useMutation({ mutationFn: (rows: Array<Record<string, unknown>>) => inspectionPlanImportService.create(rows), onSuccess: () => qc.invalidateQueries({ queryKey: ['mechanical-integrity', 'inspection-plans'] }) }),
    validate: useMutation({ mutationFn: (jobId: string) => inspectionPlanImportService.validate(jobId) }),
    commit: useMutation({ mutationFn: (jobId: string) => inspectionPlanImportService.commit(jobId), onSuccess: () => qc.invalidateQueries({ queryKey: ['mechanical-integrity', 'inspection-plans'] }) })
  };
}
