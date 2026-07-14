import { useQuery } from '@tanstack/react-query';
import { lopaFinalReportService } from '../services/lopa-final-report.service';
export function useLopaReportPackages(id: string) { return useQuery({ queryKey: ['lopa', 'final-report', id, 'packages'], queryFn: () => lopaFinalReportService.packages(id), enabled: !!id }); }
