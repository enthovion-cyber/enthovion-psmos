import { useQuery } from '@tanstack/react-query';
import { auditHistoryService } from '../services/audit-history.service';

export function useAuditHistoryDashboard(params?: Record<string, unknown>) {
  return useQuery({ queryKey: ['audit', 'history-dashboard', params], queryFn: () => auditHistoryService.dashboard(params) });
}
