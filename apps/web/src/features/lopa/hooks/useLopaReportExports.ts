import { useQuery } from '@tanstack/react-query';
import { lopaFinalReportService } from '../services/lopa-final-report.service';
export function useLopaReportExports(id: string) { return useQuery({ queryKey: ['lopa', 'final-report', id, 'exports'], queryFn: () => lopaFinalReportService.exportHistory(id), enabled: !!id }); }
