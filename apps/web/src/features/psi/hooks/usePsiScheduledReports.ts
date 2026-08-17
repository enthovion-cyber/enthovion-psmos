import { useQuery } from '@tanstack/react-query';
import { psiReportService } from '../services/psi-report.service';

export function usePsiScheduledReports(params?: Record<string, unknown>) {
  return useQuery({ queryKey: ['psi', 'reports', 'scheduled', params], queryFn: () => psiReportService.scheduled(params) });
}

export function usePsiScheduledReport(scheduleId?: string) {
  return useQuery({ queryKey: ['psi', 'reports', 'scheduled', scheduleId], queryFn: () => psiReportService.schedule(scheduleId as string), enabled: Boolean(scheduleId) });
}
