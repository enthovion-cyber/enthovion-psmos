import { useQuery } from '@tanstack/react-query';
import { auditHistoryService } from '../services/audit-history.service';

export function useAuditActivity(params?: Record<string, unknown>) {
  return useQuery({ queryKey: ['audit', 'activity', params], queryFn: () => auditHistoryService.activity(params) });
}
