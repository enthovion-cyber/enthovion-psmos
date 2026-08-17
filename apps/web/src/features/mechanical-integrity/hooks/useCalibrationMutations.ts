import { useMutation, useQueryClient } from '@tanstack/react-query';
import { calibrationPlanService } from '../services/calibration-plan.service';
import { calibrationRecordService } from '../services/calibration-record.service';

export function useCalibrationMutations(planId?: string, recordId?: string, equipmentId?: string) {
  const qc = useQueryClient();
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['mechanical-integrity', 'calibration-plans'] });
    qc.invalidateQueries({ queryKey: ['mechanical-integrity', 'calibration-records'] });
    if (equipmentId) qc.invalidateQueries({ queryKey: ['mechanical-integrity', 'calibration-plans', equipmentId] });
    if (planId) qc.invalidateQueries({ queryKey: ['mechanical-integrity', 'calibration-plan', planId] });
    if (recordId) qc.invalidateQueries({ queryKey: ['mechanical-integrity', 'calibration-record', recordId] });
  };
  return {
    createPlan: useMutation({ mutationFn: (input: Record<string, unknown>) => calibrationPlanService.create(input, equipmentId), onSuccess: invalidate }),
    updatePlan: useMutation({ mutationFn: (input: Record<string, unknown>) => calibrationPlanService.update(planId!, input), onSuccess: invalidate }),
    submitPlan: useMutation({ mutationFn: (comment?: string) => calibrationPlanService.submit(planId!, comment), onSuccess: invalidate }),
    approvePlan: useMutation({ mutationFn: (comment?: string) => calibrationPlanService.approve(planId!, comment), onSuccess: invalidate }),
    rejectPlan: useMutation({ mutationFn: (reason: string) => calibrationPlanService.reject(planId!, reason), onSuccess: invalidate }),
    runScheduler: useMutation({ mutationFn: () => calibrationPlanService.runScheduler(), onSuccess: invalidate }),
    createRecord: useMutation({ mutationFn: (input: Record<string, unknown>) => calibrationRecordService.create(input), onSuccess: invalidate }),
    updateRecord: useMutation({ mutationFn: (input: Record<string, unknown>) => calibrationRecordService.update(recordId!, input), onSuccess: invalidate }),
    evaluateRecord: useMutation({ mutationFn: () => calibrationRecordService.evaluate(recordId!), onSuccess: invalidate }),
    submitRecord: useMutation({ mutationFn: (comment?: string) => calibrationRecordService.submit(recordId!, comment), onSuccess: invalidate }),
    approveRecord: useMutation({ mutationFn: (comment?: string) => calibrationRecordService.approve(recordId!, comment), onSuccess: invalidate })
  };
}

