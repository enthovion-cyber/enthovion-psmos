import { useQuery } from '@tanstack/react-query';
import { trainingReviewService } from '../services/training-review.service';

export function useTrainingReviewDashboard(params: Record<string, unknown> = {}) {
  return useQuery({ queryKey: ['training', 'review', 'dashboard', params], queryFn: () => trainingReviewService.dashboard(params) });
}
