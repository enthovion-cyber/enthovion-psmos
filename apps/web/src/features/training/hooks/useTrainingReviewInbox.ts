import { useQuery } from '@tanstack/react-query';
import { trainingReviewService } from '../services/training-review.service';

export function useTrainingReviewInbox(params: Record<string, unknown> = {}) {
  return useQuery({ queryKey: ['training', 'review', 'inbox', params], queryFn: () => trainingReviewService.inbox(params) });
}
