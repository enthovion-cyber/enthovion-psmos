import { useQuery } from '@tanstack/react-query';
import { auditHistoryService } from '../services/audit-history.service';

export function useAuditTrendRuns(params?: Record<string, unknown>) {
  return useQuery({ queryKey: ['audit', 'trend-runs', params], queryFn: () => auditHistoryService.trendRuns(params) });
}
