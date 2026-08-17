import { useQuery } from '@tanstack/react-query';
import { miReportService } from '../services/mi-report.service';

export function useMiReports(params: Record<string, unknown> = {}) {
  return useQuery({ queryKey: ['mechanical-integrity', 'reports', params], queryFn: () => miReportService.dashboard(params) });
}

export function useMiReportLookups() {
  return useQuery({ queryKey: ['mechanical-integrity', 'report-lookups'], queryFn: miReportService.lookups });
}
