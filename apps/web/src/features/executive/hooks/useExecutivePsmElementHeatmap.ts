'use client';

import { useQuery } from '@tanstack/react-query';
import { executivePsmElementApi } from '../services/executive-psm-element.service';

export function useExecutivePsmElementHeatmap(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['executive', 'psm-elements', 'heatmap', params],
    queryFn: () => executivePsmElementApi.heatmap(params),
    refetchOnWindowFocus: false,
  });
}
