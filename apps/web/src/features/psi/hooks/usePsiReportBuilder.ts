import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { psiReportService } from '../services/psi-report.service';

export function usePsiReportBuilder() {
  const queryClient = useQueryClient();
  const lookups = {
    reportTypes: useQuery({ queryKey: ['psi', 'reports', 'lookups', 'report-types'], queryFn: () => psiReportService.lookups('report-types'), staleTime: 300_000 }),
    reportCategories: useQuery({ queryKey: ['psi', 'reports', 'lookups', 'report-categories'], queryFn: () => psiReportService.lookups('report-categories'), staleTime: 300_000 }),
    packageTypes: useQuery({ queryKey: ['psi', 'reports', 'lookups', 'export-package-types'], queryFn: () => psiReportService.lookups('export-package-types'), staleTime: 300_000 }),
    formats: useQuery({ queryKey: ['psi', 'reports', 'lookups', 'export-formats'], queryFn: () => psiReportService.lookups('export-formats'), staleTime: 300_000 }),
    sections: useQuery({ queryKey: ['psi', 'reports', 'lookups', 'report-sections'], queryFn: () => psiReportService.lookups('report-sections'), staleTime: 300_000 })
  };
  const generate = useMutation({
    mutationFn: (data: Record<string, unknown>) => psiReportService.generate(data),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['psi', 'reports'] })
  });
  const createExport = useMutation({
    mutationFn: (data: Record<string, unknown>) => psiReportService.exportCreate(data),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['psi', 'reports'] })
  });
  return { lookups, generate, createExport };
}
