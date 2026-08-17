import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { trainingMatrixService } from '../services/training-matrix.service';

export function useTrainingMatrix(params?: Record<string, unknown>) {
  return useQuery({ queryKey: ['training-matrix', params], queryFn: () => trainingMatrixService.matrix(params) });
}

export function useTrainingMatrixEvaluate() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (data?: Record<string, unknown>) => trainingMatrixService.evaluate(data), onSuccess: () => qc.invalidateQueries({ queryKey: ['training-matrix'] }) });
}
