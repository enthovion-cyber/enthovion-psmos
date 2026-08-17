import { useQuery } from '@tanstack/react-query';
import { psiReportService } from '../services/psi-report.service';

export function usePsiReportSettings() {
  return useQuery({ queryKey: ['psi', 'reports', 'settings'], queryFn: () => psiReportService.settings() });
}
