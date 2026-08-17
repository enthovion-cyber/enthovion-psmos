import { useQuery } from '@tanstack/react-query';
import { auditHistoryService } from '../services/audit-history.service';

export function useAuditTimeline(params?: Record<string, unknown>) {
  return useQuery({ queryKey: ['audit', 'timeline', params], queryFn: () => auditHistoryService.timeline(params) });
}
