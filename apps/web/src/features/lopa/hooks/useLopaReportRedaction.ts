import { useQuery } from '@tanstack/react-query';
import { lopaFinalReportService } from '../services/lopa-final-report.service';
export function useLopaReportRedaction(id: string) { return useQuery({ queryKey: ['lopa', 'final-report', id, 'redaction'], queryFn: () => lopaFinalReportService.redaction(id), enabled: !!id }); }
