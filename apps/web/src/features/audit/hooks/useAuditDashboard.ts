import { useQuery } from '@tanstack/react-query';
import { auditDashboardService } from '../services/audit-dashboard.service';

export function useAuditDashboard(filters: Record<string, unknown> = {}) {
  return useQuery({ queryKey: ['audit', 'dashboard', filters], queryFn: () => auditDashboardService.dashboard(filters) });
}
