import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { trainingMatrixService } from '../services/training-matrix.service';

export function useWorkerMatrix(workerId: string) {
  return useQuery({ queryKey: ['worker-matrix', workerId], queryFn: () => trainingMatrixService.workerMatrix(workerId), enabled: Boolean(workerId) });
}

export function useEvaluateWorkerMatrix(workerId: string) {
  const qc = useQueryClient();
  return useMutation({ mutationFn: () => trainingMatrixService.evaluateWorker(workerId), onSuccess: () => qc.invalidateQueries({ queryKey: ['worker-matrix', workerId] }) });
}
