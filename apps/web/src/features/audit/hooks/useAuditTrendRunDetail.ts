import { useQuery } from '@tanstack/react-query';
import { auditHistoryService } from '../services/audit-history.service';

export function useAuditTrendRunDetail(trendRunId: string) {
  return useQuery({ queryKey: ['audit', 'trend-run', trendRunId], queryFn: () => auditHistoryService.trendRun(trendRunId), enabled: Boolean(trendRunId) });
}
