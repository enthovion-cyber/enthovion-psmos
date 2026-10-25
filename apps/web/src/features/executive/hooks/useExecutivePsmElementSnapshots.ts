'use client';

import { useQuery } from '@tanstack/react-query';
import { executivePsmElementApi } from '../services/executive-psm-element.service';

export function useExecutivePsmElementSnapshots(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['executive', 'psm-elements', 'snapshots', params],
    queryFn: () => executivePsmElementApi.snapshots(params),
    refetchOnWindowFocus: false,
  });
}
