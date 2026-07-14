'use client';

import { useQuery } from '@tanstack/react-query';
import { billingService } from '../services/billing.service';

export function useBillingOverview() {
  return useQuery({ queryKey: ['billing', 'overview'], queryFn: billingService.overview });
}
