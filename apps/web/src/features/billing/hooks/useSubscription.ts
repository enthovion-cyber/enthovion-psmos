'use client';

import { useQuery } from '@tanstack/react-query';
import { subscriptionService } from '../services/subscription.service';

export function useSubscription() {
  return useQuery({ queryKey: ['billing', 'subscription'], queryFn: subscriptionService.current });
}
