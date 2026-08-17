import { useQuery } from '@tanstack/react-query';
import { miHistoryService } from '../services/mi-history.service';

export function useMiHistory(params: Record<string, unknown> = {}) {
  return useQuery({ queryKey: ['mechanical-integrity', 'history', params], queryFn: () => miHistoryService.dashboard(params) });
}

export function useMiHistoryTimeline(params: Record<string, unknown> = {}) {
  return useQuery({ queryKey: ['mechanical-integrity', 'history-timeline', params], queryFn: () => miHistoryService.timeline(params) });
}

export function useMiHistoryLookups() {
  return useQuery({ queryKey: ['mechanical-integrity', 'history-lookups'], queryFn: miHistoryService.lookups });
}
