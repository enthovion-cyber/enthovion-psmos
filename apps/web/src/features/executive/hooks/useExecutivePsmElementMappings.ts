'use client';

import { useQuery } from '@tanstack/react-query';
import { executivePsmElementApi } from '../services/executive-psm-element.service';

export function useExecutivePsmElementMappings(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['executive', 'psm-elements', 'mappings', params],
    queryFn: () => executivePsmElementApi.mappings(params),
    refetchOnWindowFocus: false,
  });
}

export function useExecutivePsmElementKpiMappings(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['executive', 'psm-elements', 'kpi-mappings', params],
    queryFn: () => executivePsmElementApi.kpiMappings(params),
    refetchOnWindowFocus: false,
  });
}
