import { useQuery } from '@tanstack/react-query';
import { trainingMatrixWaiverService } from '../services/training-matrix-waiver.service';

export function useMatrixWaivers(params?: Record<string, unknown>) {
  return useQuery({ queryKey: ['training-matrix-waivers', params], queryFn: () => trainingMatrixWaiverService.list(params) });
}
