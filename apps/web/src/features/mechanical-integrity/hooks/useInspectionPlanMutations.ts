'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { inspectionPlanService } from '../services/inspection-plan.service';
import { inspectionSchedulerService } from '../services/inspection-scheduler.service';

export function useInspectionPlanMutations(planId?: string, equipmentId?: string) {
  const qc = useQueryClient();
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['mechanical-integrity', 'inspection-plans'] });
    if (planId) qc.invalidateQueries({ queryKey: ['mechanical-integrity', 'inspection-plan', planId] });
  };
  return {
    create: useMutation({ mutationFn: (input: Record<string, unknown>) => inspectionPlanService.create(input, equipmentId), onSuccess: invalidate }),
    update: useMutation({ mutationFn: (input: Record<string, unknown>) => inspectionPlanService.update(planId!, input), onSuccess: invalidate }),
    submit: useMutation({ mutationFn: (comment?: string) => inspectionPlanService.submit(planId!, comment), onSuccess: invalidate }),
    approve: useMutation({ mutationFn: (comment?: string) => inspectionPlanService.approve(planId!, comment), onSuccess: invalidate }),
    reject: useMutation({ mutationFn: (reason: string) => inspectionPlanService.reject(planId!, reason), onSuccess: invalidate }),
    archive: useMutation({ mutationFn: (reason: string) => inspectionPlanService.archive(planId!, reason), onSuccess: invalidate }),
    createRevision: useMutation({ mutationFn: (reason: string) => inspectionPlanService.createRevision(planId!, reason), onSuccess: invalidate }),
    recalculate: useMutation({ mutationFn: () => inspectionSchedulerService.recalculate(planId!), onSuccess: invalidate }),
    manualOverride: useMutation({ mutationFn: (input: Record<string, unknown>) => inspectionSchedulerService.manualOverride(planId!, input), onSuccess: invalidate })
  };
}
