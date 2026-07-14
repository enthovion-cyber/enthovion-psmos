'use client';

import { useQuery } from '@tanstack/react-query';
import { publicPlansService } from '../services/public-plans.service';
import { mergePublicPlans } from '../utils/plan-display';

export function usePublicPlans() {
  return useQuery({
    queryKey: ['marketing', 'public-plans'],
    queryFn: publicPlansService.plans,
    select: mergePublicPlans,
    staleTime: 300_000,
    retry: 1
  });
}

export function useMarketingConfig() {
  return useQuery({ queryKey: ['marketing', 'config'], queryFn: publicPlansService.marketingConfig, staleTime: 300_000, retry: 1 });
}
