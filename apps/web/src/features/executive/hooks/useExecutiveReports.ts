import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { executiveReportApi } from '../services/executive-report.service';

export function useExecutiveReportDashboard(params?: Record<string, any>) {
  return useQuery({
    queryKey: ['executive', 'reports', 'dashboard', params],
    queryFn: () => executiveReportApi.dashboard(params),
  });
}

export function useExecutiveReportLookups() {
  return useQuery({
    queryKey: ['executive', 'reports', 'lookups'],
    queryFn: () => executiveReportApi.lookups(),
  });
}

export function useExecutiveBoardDashboard(params?: Record<string, any>) {
  return useQuery({
    queryKey: ['executive', 'reports', 'board', 'dashboard', params],
    queryFn: () => executiveReportApi.boardDashboard(params),
  });
}

export function useExecutiveBoardPackages(params?: Record<string, any>) {
  return useQuery({
    queryKey: ['executive', 'reports', 'board', 'packages', params],
    queryFn: () => executiveReportApi.boardPackages(params),
  });
}

export function useExecutiveReportRegister(params?: Record<string, any>) {
  return useQuery({
    queryKey: ['executive', 'reports', 'register', params],
    queryFn: () => executiveReportApi.register(params),
  });
}

export const useExecutiveReports = useExecutiveReportRegister;

export function useExecutiveReportDetail(id: string) {
  return useQuery({
    queryKey: ['executive', 'reports', id],
    queryFn: () => executiveReportApi.detail(id),
    enabled: Boolean(id),
  });
}

export function useExecutiveReportContents(id: string) {
  return useQuery({
    queryKey: ['executive', 'reports', id, 'contents'],
    queryFn: () => executiveReportApi.contents(id),
    enabled: Boolean(id),
  });
}

export function useExecutiveReportSources(id: string) {
  return useQuery({
    queryKey: ['executive', 'reports', id, 'sources'],
    queryFn: () => executiveReportApi.sources(id),
    enabled: Boolean(id),
  });
}

export function useExecutiveReportReadiness(id: string) {
  return useQuery({
    queryKey: ['executive', 'reports', id, 'readiness'],
    queryFn: () => executiveReportApi.readiness(id),
    enabled: Boolean(id),
  });
}

export function useExecutiveReportPreview(id: string) {
  return useQuery({
    queryKey: ['executive', 'reports', id, 'preview'],
    queryFn: () => executiveReportApi.preview(id),
    enabled: Boolean(id),
  });
}

export function useExecutiveReportArtifacts(id: string) {
  return useQuery({
    queryKey: ['executive', 'reports', id, 'artifacts'],
    queryFn: () => executiveReportApi.artifacts(id),
    enabled: Boolean(id),
  });
}

export function useExecutiveReportDistribution(id?: string) {
  return useQuery({
    queryKey: ['executive', 'reports', id ?? 'all', 'distribution'],
    queryFn: () => (id ? executiveReportApi.distribution(id) : executiveReportApi.distribution('all')),
  });
}

export function useExecutiveReportHistory(id: string) {
  return useQuery({
    queryKey: ['executive', 'reports', id, 'history'],
    queryFn: () => executiveReportApi.history(id),
    enabled: Boolean(id),
  });
}

export function useExecutiveReportTemplates() {
  return useQuery({
    queryKey: ['executive', 'reports', 'templates'],
    queryFn: () => executiveReportApi.templates(),
  });
}

export function useExecutiveReportPeriods(params?: Record<string, any>) {
  return useQuery({
    queryKey: ['executive', 'reports', 'periods', params],
    queryFn: () => executiveReportApi.periods(params),
  });
}

export function useExecutiveReportAudiences() {
  return useQuery({
    queryKey: ['executive', 'reports', 'audiences'],
    queryFn: () => executiveReportApi.audiences(),
  });
}

export function useExecutiveReportSchedules() {
  return useQuery({
    queryKey: ['executive', 'reports', 'schedules'],
    queryFn: () => executiveReportApi.schedules(),
  });
}

export function useExecutiveReportStaleness(reportId?: string) {
  return useQuery({
    queryKey: ['executive', 'reports', reportId ?? 'global', 'staleness'],
    queryFn: () => executiveReportApi.staleness(reportId),
  });
}

export function useExecutiveReportMutations() {
  const queryClient = useQueryClient();
  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: ['executive', 'reports'] });
  };

  const createTemplateMutation = useMutation({
    mutationFn: (body: Record<string, any>) => executiveReportApi.createTemplate(body),
    onSuccess: refresh,
  });

  const createPeriodMutation = useMutation({
    mutationFn: (body: Record<string, any>) => executiveReportApi.createPeriod(body),
    onSuccess: refresh,
  });

  const createAudienceMutation = useMutation({
    mutationFn: (body: Record<string, any>) => executiveReportApi.createAudience(body),
    onSuccess: refresh,
  });

  const createScheduleMutation = useMutation({
    mutationFn: (body: Record<string, any>) => executiveReportApi.createSchedule(body),
    onSuccess: refresh,
  });

  return {
    createReport: useMutation({
      mutationFn: (body: Record<string, any>) => executiveReportApi.create(body),
      onSuccess: refresh,
    }),
    createBoardPackage: useMutation({
      mutationFn: (body: Record<string, any>) => executiveReportApi.createBoardPackage(body),
      onSuccess: refresh,
    }),
    updateReport: useMutation({
      mutationFn: ({ id, body }: { id: string; body: Record<string, any> }) =>
        executiveReportApi.update(id, body),
      onSuccess: refresh,
    }),
    archiveReport: useMutation({
      mutationFn: ({ id, body }: { id: string; body?: Record<string, any> }) =>
        executiveReportApi.archive(id, body),
      onSuccess: refresh,
    }),
    validateReport: useMutation({
      mutationFn: (id: string) => executiveReportApi.validate(id),
      onSuccess: refresh,
    }),
    generateArtifact: useMutation({
      mutationFn: ({ id, format }: { id: string; format: string }) =>
        executiveReportApi.generate(id, format),
      onSuccess: refresh,
    }),
    downloadArtifact: useMutation({
      mutationFn: (artifactId: string) => executiveReportApi.downloadArtifact(artifactId),
    }),
    submitApproval: useMutation({
      mutationFn: ({ id, body }: { id: string; body?: Record<string, any> }) =>
        executiveReportApi.submitApproval(id, body),
      onSuccess: refresh,
    }),
    approveReport: useMutation({
      mutationFn: ({ id, body }: { id: string; body?: Record<string, any> }) =>
        executiveReportApi.approve(id, body),
      onSuccess: refresh,
    }),
    rejectReport: useMutation({
      mutationFn: ({ id, body }: { id: string; body?: Record<string, any> }) =>
        executiveReportApi.reject(id, body),
      onSuccess: refresh,
    }),
    publishReport: useMutation({
      mutationFn: ({ id, body }: { id: string; body?: Record<string, any> }) =>
        executiveReportApi.publish(id, body),
      onSuccess: refresh,
    }),
    createVersion: useMutation({
      mutationFn: ({ reportId, changeSummary }: { reportId: string; changeSummary?: string }) =>
        executiveReportApi.createVersion(reportId, { changeSummary }),
      onSuccess: refresh,
    }),
    sendDistribution: useMutation({
      mutationFn: ({ id, body }: { id: string; body?: Record<string, any> }) =>
        executiveReportApi.sendDistribution(id, body),
      onSuccess: refresh,
    }),
    revokeDistribution: useMutation({
      mutationFn: (distributionId: string) =>
        executiveReportApi.revokeDistribution(distributionId),
      onSuccess: refresh,
    }),
    createTemplate: createTemplateMutation,
    saveTemplate: createTemplateMutation,
    createPeriod: createPeriodMutation,
    savePeriod: createPeriodMutation,
    createAudience: createAudienceMutation,
    saveAudience: createAudienceMutation,
    createSchedule: createScheduleMutation,
    saveSchedule: createScheduleMutation,
    triggerStaleness: useMutation({
      mutationFn: (reportId?: string) => executiveReportApi.triggerStaleness(reportId),
      onSuccess: refresh,
    }),
  };
}
