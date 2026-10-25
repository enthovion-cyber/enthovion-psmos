import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { regulatoryReportService } from '../services/regulatory-report.service';

export function useRegulatoryReports(filters?: Record<string, unknown>) {
  return useQuery({ queryKey: ['regulatory', 'reports', filters], queryFn: () => regulatoryReportService.register(filters), refetchOnWindowFocus: false });
}

export function useRegulatoryReportDashboard(filters?: Record<string, unknown>) {
  return useQuery({ queryKey: ['regulatory', 'reports', 'dashboard', filters], queryFn: () => regulatoryReportService.dashboard(filters), refetchOnWindowFocus: false });
}

export function useRegulatoryReport(reportId?: string) {
  return useQuery({ queryKey: ['regulatory', 'reports', reportId], queryFn: () => regulatoryReportService.detail(reportId as string), enabled: Boolean(reportId), refetchOnWindowFocus: false });
}

export function useRegulatoryReportMutation() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ action, reportId, data }: { action: 'create' | 'generate' | 'regenerate' | 'preview' | 'download' | 'export' | 'lock' | 'unlock' | 'submitApproval' | 'archive'; reportId?: string; data?: Record<string, unknown> }) => {
      if (action === 'create') return regulatoryReportService.create(data ?? {});
      if (action === 'generate') return regulatoryReportService.generate(data ?? {});
      if (!reportId) throw new Error('Report identifier is required.');
      const fn = regulatoryReportService[action] as (id: string, payload?: Record<string, unknown>) => Promise<unknown>;
      return fn(reportId, data);
    },
    onSuccess: () => client.invalidateQueries({ queryKey: ['regulatory', 'reports'] })
  });
}
