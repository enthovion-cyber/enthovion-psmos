import { useQuery } from '@tanstack/react-query';
import { psiReportService } from '../services/psi-report.service';

export function usePsiGeneratedReports(params?: Record<string, unknown>) {
  return useQuery({ queryKey: ['psi', 'reports', 'generated', params], queryFn: () => psiReportService.generated(params) });
}
