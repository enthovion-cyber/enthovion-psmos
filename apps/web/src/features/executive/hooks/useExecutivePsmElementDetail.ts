'use client';

import { useQuery } from '@tanstack/react-query';
import { executivePsmElementApi } from '../services/executive-psm-element.service';

export function useExecutivePsmElementDetail(elementId: string, params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['executive', 'psm-elements', 'detail', elementId, params],
    queryFn: () => executivePsmElementApi.detail(elementId, params),
    enabled: Boolean(elementId),
    refetchOnWindowFocus: false,
  });
}
