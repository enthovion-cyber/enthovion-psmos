import { useQuery } from '@tanstack/react-query';
import { trainingMatrixService } from '../services/training-matrix.service';

export function useTrainingMatrixDashboard(params?: Record<string, unknown>) {
  return useQuery({ queryKey: ['training-matrix-dashboard', params], queryFn: () => trainingMatrixService.dashboard(params) });
}
