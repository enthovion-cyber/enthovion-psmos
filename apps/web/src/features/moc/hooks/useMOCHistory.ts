'use client';

import { useQuery } from '@tanstack/react-query';
import { mocHistoryService } from '../services/moc-history.service';

export function useMOCHistory(id: string, filters: Record<string, any>) {
  const events = useQuery({ queryKey: ['moc', id, 'history', filters], queryFn: () => mocHistoryService.list(id, filters), enabled: Boolean(id), refetchOnWindowFocus: false });
  const summary = useQuery({ queryKey: ['moc', id, 'history-summary'], queryFn: () => mocHistoryService.summary(id), enabled: Boolean(id), refetchOnWindowFocus: false });
  return { events, summary };
}
