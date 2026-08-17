import { useQuery } from '@tanstack/react-query';
import { auditHistoryService } from '../services/audit-history.service';

export function useAuditRecurringIssues(params?: Record<string, unknown>) {
  return useQuery({ queryKey: ['audit', 'recurring-issues', params], queryFn: () => auditHistoryService.recurringIssues(params) });
}
