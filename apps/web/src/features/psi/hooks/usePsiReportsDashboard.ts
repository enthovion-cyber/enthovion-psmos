import { useQuery } from '@tanstack/react-query';
import { psiReportService } from '../services/psi-report.service';

export function usePsiReportsDashboard(params?: Record<string, unknown>) {
  return useQuery({ queryKey: ['psi', 'reports', 'dashboard', params], queryFn: () => psiReportService.dashboard(params) });
}
