'use client';

import { useQuery } from '@tanstack/react-query';
import { executivePsmElementApi } from '../services/executive-psm-element.service';

export function useExecutivePsmElementSettings() {
  return useQuery({
    queryKey: ['executive', 'psm-elements', 'settings'],
    queryFn: () => executivePsmElementApi.settings(),
    refetchOnWindowFocus: false,
  });
}
