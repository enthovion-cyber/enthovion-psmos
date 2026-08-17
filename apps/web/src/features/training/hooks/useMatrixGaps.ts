import { useQuery } from '@tanstack/react-query';
import { trainingMatrixGapService } from '../services/training-matrix-gap.service';

export function useMatrixGaps(params?: Record<string, unknown>) {
  return useQuery({ queryKey: ['training-matrix-gaps', params], queryFn: () => trainingMatrixGapService.list(params) });
}
