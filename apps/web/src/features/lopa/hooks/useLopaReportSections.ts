import { useQuery } from '@tanstack/react-query';
import { lopaFinalReportService } from '../services/lopa-final-report.service';
export function useLopaReportSections(id: string) { return useQuery({ queryKey: ['lopa', 'final-report', id, 'sections'], queryFn: () => lopaFinalReportService.sections(id), enabled: !!id }); }
