import { useQuery } from '@tanstack/react-query';
import { lopaFinalReportService } from '../services/lopa-final-report.service';
export function useLopaReportReadiness(id: string) { return useQuery({ queryKey: ['lopa', 'final-report', id, 'readiness'], queryFn: () => lopaFinalReportService.readiness(id), enabled: !!id }); }
