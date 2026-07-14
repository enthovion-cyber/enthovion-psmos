'use client';

import { useQuery } from '@tanstack/react-query';
import { planService } from '../services/plan.service';

export function usePlans() {
  return useQuery({ queryKey: ['billing', 'plans'], queryFn: planService.list });
}
