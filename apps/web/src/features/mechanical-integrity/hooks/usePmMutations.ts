import { useMutation, useQueryClient } from '@tanstack/react-query';
import { pmPlanService } from '../services/pm-plan.service';
import { pmRecordService } from '../services/pm-record.service';

export function usePmMutations(planId?: string, recordId?: string, equipmentId?: string) {
  const qc = useQueryClient();
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['mechanical-integrity', 'pm-plans'] });
    qc.invalidateQueries({ queryKey: ['mechanical-integrity', 'pm-records'] });
    if (equipmentId) qc.invalidateQueries({ queryKey: ['mechanical-integrity', 'pm-plans', equipmentId] });
    if (planId) qc.invalidateQueries({ queryKey: ['mechanical-integrity', 'pm-plan', planId] });
    if (recordId) qc.invalidateQueries({ queryKey: ['mechanical-integrity', 'pm-record', recordId] });
  };
  return {
    createPlan: useMutation({ mutationFn: (input: Record<string, unknown>) => pmPlanService.create(input, equipmentId), onSuccess: invalidate }),
    updatePlan: useMutation({ mutationFn: (input: Record<string, unknown>) => pmPlanService.update(planId!, input), onSuccess: invalidate }),
    submitPlan: useMutation({ mutationFn: (comment?: string) => pmPlanService.submit(planId!, comment), onSuccess: invalidate }),
    approvePlan: useMutation({ mutationFn: (comment?: string) => pmPlanService.approve(planId!, comment), onSuccess: invalidate }),
    rejectPlan: useMutation({ mutationFn: (reason: string) => pmPlanService.reject(planId!, reason), onSuccess: invalidate }),
    archivePlan: useMutation({ mutationFn: (reason: string) => pmPlanService.archive(planId!, reason), onSuccess: invalidate }),
    runScheduler: useMutation({ mutationFn: () => pmPlanService.runScheduler(), onSuccess: invalidate }),
    createRecord: useMutation({ mutationFn: (input: Record<string, unknown>) => pmRecordService.create(input), onSuccess: invalidate }),
    updateRecord: useMutation({ mutationFn: (input: Record<string, unknown>) => pmRecordService.update(recordId!, input), onSuccess: invalidate }),
    submitRecord: useMutation({ mutationFn: (comment?: string) => pmRecordService.submit(recordId!, comment), onSuccess: invalidate }),
    approveRecord: useMutation({ mutationFn: (comment?: string) => pmRecordService.approve(recordId!, comment), onSuccess: invalidate }),
    rejectRecord: useMutation({ mutationFn: (reason: string) => pmRecordService.reject(recordId!, reason), onSuccess: invalidate })
  };
}

