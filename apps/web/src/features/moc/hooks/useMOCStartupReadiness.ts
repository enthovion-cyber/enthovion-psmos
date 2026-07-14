'use client';

import { useQuery } from '@tanstack/react-query';
import { mocStartupService } from '../services/moc-startup.service';

export function useMOCStartupReadiness(id: string) {
  return useQuery({ queryKey: ['moc', id, 'pssr-startup'], queryFn: () => mocStartupService.aggregate(id), enabled: Boolean(id), refetchOnWindowFocus: false });
}
