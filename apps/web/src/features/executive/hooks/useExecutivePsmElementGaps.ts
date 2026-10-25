'use client';

import { useQuery } from '@tanstack/react-query';
import { executivePsmElementApi } from '../services/executive-psm-element.service';

export function useExecutivePsmElementGaps(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['executive', 'psm-elements', 'gaps', params],
    queryFn: () => executivePsmElementApi.gaps(params),
    refetchOnWindowFocus: false,
  });
}
