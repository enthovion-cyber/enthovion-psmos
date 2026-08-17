import { useQuery } from '@tanstack/react-query';
import { psiReportService } from '../services/psi-report.service';

export function usePsiReportTemplates(params?: Record<string, unknown>) {
  return useQuery({ queryKey: ['psi', 'reports', 'templates', params], queryFn: () => psiReportService.templates(params) });
}

export function usePsiReportTemplate(templateId?: string) {
  return useQuery({ queryKey: ['psi', 'reports', 'templates', templateId], queryFn: () => psiReportService.template(templateId as string), enabled: Boolean(templateId) });
}
