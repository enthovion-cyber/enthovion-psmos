'use client';

import { useQuery } from '@tanstack/react-query';
import { executivePsmElementApi } from '../services/executive-psm-element.service';

export function useExecutivePsmElementBreakdown(type: 'site' | 'unit', params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['executive', 'psm-elements', 'breakdown', type, params],
    queryFn: () => executivePsmElementApi.breakdown(type, params),
    refetchOnWindowFocus: false,
  });
}
