'use client';

import { useQuery } from '@tanstack/react-query';
import { regulatoryReviewService } from '../services/regulatory-review.service';

export function useRegulatoryReviewDashboard(filters?: Record<string, unknown>) {
  return useQuery({ queryKey: ['regulatory', 'review-approval', 'dashboard', filters], queryFn: () => regulatoryReviewService.dashboard(filters), refetchOnWindowFocus: false });
}
