import { useQuery } from '@tanstack/react-query';
import { auditHistoryService } from '../services/audit-history.service';

export function useAuditTrendLookups() {
  return useQuery({ queryKey: ['audit', 'trend-lookups'], queryFn: () => auditHistoryService.lookups() });
}
