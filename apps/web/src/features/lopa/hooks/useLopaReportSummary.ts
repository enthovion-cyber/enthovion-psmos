import { useQuery } from '@tanstack/react-query';
import { lopaFinalReportService } from '../services/lopa-final-report.service';
export function useLopaReportSummary(id: string) { return useQuery({ queryKey: ['lopa', 'final-report', id, 'summary'], queryFn: () => lopaFinalReportService.summary(id), enabled: !!id }); }
