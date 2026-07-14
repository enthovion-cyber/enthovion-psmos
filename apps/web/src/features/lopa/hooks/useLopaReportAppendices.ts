import { useQuery } from '@tanstack/react-query';
import { lopaFinalReportService } from '../services/lopa-final-report.service';
export function useLopaReportAppendices(id: string) { return useQuery({ queryKey: ['lopa', 'final-report', id, 'appendices'], queryFn: () => lopaFinalReportService.appendices(id), enabled: !!id }); }
