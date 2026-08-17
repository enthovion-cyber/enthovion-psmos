import { useMutation, useQueryClient } from '@tanstack/react-query';
import { auditHistoryService } from '../services/audit-history.service';

export function useAuditTrendMutations() {
  const queryClient = useQueryClient();
  return {
    create: useMutation({ mutationFn: (data: Record<string, unknown>) => auditHistoryService.createTrendRun(data), onSuccess: () => queryClient.invalidateQueries({ queryKey: ['audit', 'trend-runs'] }) }),
    recalculate: useMutation({ mutationFn: (trendRunId: string) => auditHistoryService.recalculateTrendRun(trendRunId), onSuccess: () => queryClient.invalidateQueries({ queryKey: ['audit', 'trend-runs'] }) }),
    archive: useMutation({ mutationFn: ({ trendRunId, data }: { trendRunId: string; data: Record<string, unknown> }) => auditHistoryService.archiveTrendRun(trendRunId, data), onSuccess: () => queryClient.invalidateQueries({ queryKey: ['audit', 'trend-runs'] }) }),
  };
}
