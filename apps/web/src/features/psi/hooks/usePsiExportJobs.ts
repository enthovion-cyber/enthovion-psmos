import { useQuery } from '@tanstack/react-query';
import { psiReportService } from '../services/psi-report.service';

export function usePsiExportJobs(params?: Record<string, unknown>) {
  return useQuery({ queryKey: ['psi', 'reports', 'export-jobs', params], queryFn: () => psiReportService.exportJobs(params) });
}

export function usePsiExportJob(jobId?: string) {
  return useQuery({ queryKey: ['psi', 'reports', 'export-jobs', jobId], queryFn: () => psiReportService.exportJob(jobId as string), enabled: Boolean(jobId) });
}
