import { useQuery } from '@tanstack/react-query';
import { trainingMatrixService } from '../services/training-matrix.service';

export function useMatrixEvaluations(params?: Record<string, unknown>) {
  return useQuery({ queryKey: ['training-matrix-evaluations', params], queryFn: () => trainingMatrixService.evaluations(params) });
}

export function useMatrixRunHistory(params?: Record<string, unknown>) {
  return useQuery({ queryKey: ['training-matrix-runs', params], queryFn: () => trainingMatrixService.runs(params) });
}
