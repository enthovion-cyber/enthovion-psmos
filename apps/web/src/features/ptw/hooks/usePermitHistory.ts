import { useQuery } from '@tanstack/react-query';
import { ptwHistoryService, type PermitHistoryFilters } from '../services/ptw-history.service';

export function usePermitHistory(permitId: string, filters: PermitHistoryFilters) {
  return useQuery({ queryKey: ['ptw', permitId, 'history', filters], queryFn: () => ptwHistoryService.list(permitId, filters) });
}

export function usePermitHistorySummary(permitId: string) {
  return useQuery({ queryKey: ['ptw', permitId, 'history', 'summary'], queryFn: () => ptwHistoryService.summary(permitId) });
}
