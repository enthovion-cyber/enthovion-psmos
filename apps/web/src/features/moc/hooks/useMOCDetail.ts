'use client';

import { useQuery } from '@tanstack/react-query';
import { mocService } from '../services/moc.service';

export function useMOCDetail(id: string) {
  return useQuery({ queryKey: ['moc', id, 'detail'], queryFn: () => mocService.get(id), enabled: Boolean(id), refetchOnWindowFocus: false });
}

export function useMOCTabQuery<T = any>(id: string, tab: string, queryFn: () => Promise<T>, enabled = true) {
  return useQuery({ queryKey: ['moc', id, tab], queryFn, enabled: Boolean(id) && enabled, refetchOnWindowFocus: false });
}
