import { useMutation, useQueryClient } from '@tanstack/react-query';
import { trainingRecordsService } from '../services/training-records.service';

export function useTrainingCompletionMutations(recordId?: string) {
  const qc = useQueryClient();
  const invalidate = () => void qc.invalidateQueries({ queryKey: ['training-records'] });
  return {
    createRecord: useMutation({ mutationFn: (data: Record<string, unknown>) => trainingRecordsService.createRecord(data), onSuccess: invalidate }),
    verifyRecord: useMutation({ mutationFn: (data: Record<string, unknown>) => trainingRecordsService.verifyRecord(recordId ?? String(data.recordId), data), onSuccess: invalidate }),
    rejectRecord: useMutation({ mutationFn: (data: Record<string, unknown>) => trainingRecordsService.rejectRecord(recordId ?? String(data.recordId), data), onSuccess: invalidate }),
    approveRecord: useMutation({ mutationFn: (data: Record<string, unknown>) => trainingRecordsService.approveRecord(recordId ?? String(data.recordId), data), onSuccess: invalidate }),
    reopenRecord: useMutation({ mutationFn: (data: Record<string, unknown>) => trainingRecordsService.reopenRecord(recordId ?? String(data.recordId), data), onSuccess: invalidate }),
    recalculateRecord: useMutation({ mutationFn: () => trainingRecordsService.recalculateRecord(recordId ?? ''), onSuccess: invalidate })
  };
}
