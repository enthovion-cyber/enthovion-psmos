import { useQuery } from '@tanstack/react-query';
import { psiReportService } from '../services/psi-report.service';

export function usePsiReportDetail(reportId?: string) {
  return useQuery({ queryKey: ['psi', 'reports', 'generated', reportId], queryFn: () => psiReportService.report(reportId as string), enabled: Boolean(reportId) });
}

export function usePsiReportPreview(reportId?: string) {
  return useQuery({ queryKey: ['psi', 'reports', 'preview', reportId], queryFn: () => psiReportService.preview(reportId as string), enabled: Boolean(reportId) });
}
