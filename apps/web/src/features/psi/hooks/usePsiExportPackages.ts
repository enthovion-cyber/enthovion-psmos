import { useQuery } from '@tanstack/react-query';
import { psiReportService } from '../services/psi-report.service';

export function usePsiExportPackages(params?: Record<string, unknown>) {
  return useQuery({ queryKey: ['psi', 'reports', 'packages', params], queryFn: () => psiReportService.packages(params) });
}

export function usePsiExportPackage(packageId?: string) {
  return useQuery({ queryKey: ['psi', 'reports', 'packages', packageId], queryFn: () => psiReportService.package(packageId as string), enabled: Boolean(packageId) });
}
