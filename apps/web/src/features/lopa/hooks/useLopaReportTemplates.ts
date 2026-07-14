import { useQuery } from '@tanstack/react-query';
import { lopaFinalReportService } from '../services/lopa-final-report.service';
export function useLopaReportTemplates(id: string) { return useQuery({ queryKey: ['lopa', 'final-report', id, 'templates'], queryFn: () => lopaFinalReportService.templates(id), enabled: !!id }); }
