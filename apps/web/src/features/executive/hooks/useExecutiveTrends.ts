import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { executiveTrendApi } from '../services/executive-trend.service';
import type {
  ExecutiveTrendDashboard,
  ExecutiveTrendCollection,
  ExecutiveTrendRun,
  ExecutiveRepeatIssue,
  ExecutiveRecurringCluster,
  ExecutiveTrendAlert,
  ExecutiveTrendAlertRule,
  ExecutiveTrendInsight,
} from '../types/executive-trend.types';

export function useExecutiveTrendDashboard(params?: Record<string, unknown>) {
  return useQuery<ExecutiveTrendDashboard>({
    queryKey: ['executive', 'trends', 'dashboard', params],
    queryFn: () => executiveTrendApi.dashboard(params),
  });
}

export function useExecutiveTrendExplorer(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['executive', 'trends', 'explorer', params],
    queryFn: () => executiveTrendApi.explorer(params),
  });
}

export function useExecutiveTrendSection(section: string, params?: Record<string, unknown>) {
  return useQuery<ExecutiveTrendCollection>({
    queryKey: ['executive', 'trends', section, params],
    queryFn: () => executiveTrendApi.section(section, params),
    enabled: Boolean(section),
  });
}

export function useExecutiveTrendRuns(params?: Record<string, unknown>) {
  return useQuery<{ rows: ExecutiveTrendRun[]; total: number }>({
    queryKey: ['executive', 'trends', 'runs', params],
    queryFn: () => executiveTrendApi.runs(params),
  });
}

export function useExecutiveTrendRun(id: string) {
  return useQuery({
    queryKey: ['executive', 'trends', 'runs', id],
    queryFn: () => executiveTrendApi.run(id),
    enabled: Boolean(id),
  });
}

export function useExecutiveRepeatIssues(params?: Record<string, unknown>) {
  return useQuery<{ rows: ExecutiveRepeatIssue[]; total: number }>({
    queryKey: ['executive', 'trends', 'repeat-issues', params],
    queryFn: () => executiveTrendApi.repeatIssues(params),
  });
}

export function useExecutiveRepeatIssue(id: string) {
  return useQuery({
    queryKey: ['executive', 'trends', 'repeat-issues', id],
    queryFn: () => executiveTrendApi.repeat(id),
    enabled: Boolean(id),
  });
}

export function useExecutiveRecurringClusters(params?: Record<string, unknown>) {
  return useQuery<{ rows: ExecutiveRecurringCluster[]; total: number }>({
    queryKey: ['executive', 'trends', 'recurring-issues', 'clusters', params],
    queryFn: () => executiveTrendApi.recurringClusters(params),
  });
}

export function useExecutiveRecurringCluster(id: string) {
  return useQuery({
    queryKey: ['executive', 'trends', 'recurring-issues', 'clusters', id],
    queryFn: () => executiveTrendApi.cluster(id),
    enabled: Boolean(id),
  });
}

export function useExecutiveTrendAlerts(params?: Record<string, unknown>) {
  return useQuery<{ rows: ExecutiveTrendAlert[]; total: number }>({
    queryKey: ['executive', 'trends', 'alerts', params],
    queryFn: () => executiveTrendApi.alerts(params),
  });
}

export function useExecutiveTrendAlertRules(params?: Record<string, unknown>) {
  return useQuery<{ rows: ExecutiveTrendAlertRule[]; total: number }>({
    queryKey: ['executive', 'trends', 'alert-rules', params],
    queryFn: () => executiveTrendApi.alertRules(params),
  });
}

export function useExecutiveTrendAlertRule(id: string) {
  return useQuery({
    queryKey: ['executive', 'trends', 'alert-rules', id],
    queryFn: () => executiveTrendApi.alertRule(id),
    enabled: Boolean(id),
  });
}

export function useExecutiveTrendInsights(params?: Record<string, unknown>) {
  return useQuery<{ rows: ExecutiveTrendInsight[]; total: number }>({
    queryKey: ['executive', 'trends', 'insights', params],
    queryFn: () => executiveTrendApi.insights(params),
  });
}

export function useExecutiveTrendComparisons(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['executive', 'trends', 'compare', params],
    queryFn: () => executiveTrendApi.comparisons(params),
  });
}

export function useExecutiveTrendMethodology() {
  return useQuery({
    queryKey: ['executive', 'trends', 'methodology'],
    queryFn: () => executiveTrendApi.methodology(),
  });
}

export function useExecutiveTrendSettings() {
  return useQuery({
    queryKey: ['executive', 'trends', 'settings'],
    queryFn: () => executiveTrendApi.settings(),
  });
}

export function useExecutiveTrendLookups(kind: string) {
  return useQuery({
    queryKey: ['executive', 'lookups', kind],
    queryFn: () => executiveTrendApi.lookups(kind),
    staleTime: 5 * 60 * 1000,
  });
}

export function useExecutiveTrendMutations() {
  const client = useQueryClient();
  const refresh = () => {
    void client.invalidateQueries({ queryKey: ['executive', 'trends'] });
    void client.invalidateQueries({ queryKey: ['executive', 'dashboard'] });
  };

  return {
    createRun: useMutation({
      mutationFn: (body: Record<string, unknown>) => executiveTrendApi.createRun(body),
      onSuccess: refresh,
    }),
    recalculateRun: useMutation({
      mutationFn: ({ id, body }: { id: string; body?: Record<string, unknown> }) =>
        executiveTrendApi.recalculateRun(id, body),
      onSuccess: refresh,
    }),
    cancelRun: useMutation({
      mutationFn: (id: string) => executiveTrendApi.cancelRun(id),
      onSuccess: refresh,
    }),
    archiveRun: useMutation({
      mutationFn: ({ id, reason }: { id: string; reason: string }) =>
        executiveTrendApi.archiveRun(id, reason),
      onSuccess: refresh,
    }),

    detectRepeats: useMutation({
      mutationFn: (body?: Record<string, unknown>) => executiveTrendApi.detectRepeats(body),
      onSuccess: refresh,
    }),
    reviewRepeat: useMutation({
      mutationFn: ({
        candidateId,
        dto,
      }: {
        candidateId: string;
        dto: { reviewStatus: string; reviewNotes?: string; severityClassification?: string };
      }) =>
        dto.reviewStatus === 'False Positive' || dto.reviewStatus === 'Rejected'
          ? executiveTrendApi.rejectRepeat(candidateId, dto.reviewNotes || '')
          : executiveTrendApi.confirmRepeat(candidateId, dto.reviewNotes || ''),
      onSuccess: refresh,
    }),
    confirmRepeat: useMutation({
      mutationFn: ({ id, reason }: { id: string; reason: string }) =>
        executiveTrendApi.confirmRepeat(id, reason),
      onSuccess: refresh,
    }),
    rejectRepeat: useMutation({
      mutationFn: ({ id, reason }: { id: string; reason: string }) =>
        executiveTrendApi.rejectRepeat(id, reason),
      onSuccess: refresh,
    }),
    createRepeatAction: useMutation({
      mutationFn: (args: { id?: string; candidateId?: string; body?: Record<string, unknown>; dto?: Record<string, unknown> }) =>
        executiveTrendApi.createRepeatAction(args.id || args.candidateId || '', args.body || args.dto || {}),
      onSuccess: refresh,
    }),
    addRepeatToManagementReview: useMutation({
      mutationFn: (id: string) => executiveTrendApi.addRepeatToManagementReview(id),
      onSuccess: refresh,
    }),
    addToManagementReview: useMutation({
      mutationFn: (args: string | { candidateId?: string; id?: string; notes?: string }) => {
        const id = typeof args === 'string' ? args : (args.candidateId || args.id || '');
        return executiveTrendApi.addRepeatToManagementReview(id);
      },
      onSuccess: refresh,
    }),

    reviewCluster: useMutation({
      mutationFn: ({ id, body }: { id: string; body: Record<string, unknown> }) =>
        executiveTrendApi.reviewCluster(id, body),
      onSuccess: refresh,
    }),
    addClusterToManagementReview: useMutation({
      mutationFn: (id: string) => executiveTrendApi.addClusterToManagementReview(id),
      onSuccess: refresh,
    }),

    acknowledgeAlert: useMutation({
      mutationFn: (args: string | { alertId?: string; id?: string; notes?: string }) => {
        const id = typeof args === 'string' ? args : (args.alertId || args.id || '');
        return executiveTrendApi.acknowledgeAlert(id);
      },
      onSuccess: refresh,
    }),
    resolveAlert: useMutation({
      mutationFn: (args: { id?: string; alertId?: string; reason?: string; resolutionNotes?: string }) => {
        const id = args.id || args.alertId || '';
        const reason = args.reason || args.resolutionNotes || '';
        return executiveTrendApi.resolveAlert(id, reason);
      },
      onSuccess: refresh,
    }),
    escalateAlert: useMutation({
      mutationFn: (id: string) => executiveTrendApi.escalateAlert(id),
      onSuccess: refresh,
    }),
    createAlertRule: useMutation({
      mutationFn: (body: Record<string, unknown>) => executiveTrendApi.createAlertRule(body),
      onSuccess: refresh,
    }),
    updateAlertRule: useMutation({
      mutationFn: ({ id, body }: { id: string; body: Record<string, unknown> }) =>
        executiveTrendApi.updateAlertRule(id, body),
      onSuccess: refresh,
    }),
    testAlertRule: useMutation({
      mutationFn: (args: string | { id?: string; ruleId?: string; body?: Record<string, unknown> }) => {
        const id = typeof args === 'string' ? args : (args.id || args.ruleId || '');
        const body = typeof args === 'object' ? args.body : undefined;
        return executiveTrendApi.testAlertRule(id, body);
      },
    }),

    reviewInsight: useMutation({
      mutationFn: (args: { id?: string; insightId?: string; reason?: string; dismiss?: boolean; dto?: { reviewStatus?: string; reviewNotes?: string } }) => {
        const id = args.id || args.insightId || '';
        const reason = args.reason || args.dto?.reviewNotes || 'Reviewed';
        const dismiss = args.dismiss ?? (args.dto?.reviewStatus === 'Dismissed');
        return executiveTrendApi.reviewInsight(id, reason, dismiss);
      },
      onSuccess: refresh,
    }),
    addInsightToManagementReview: useMutation({
      mutationFn: (id: string) => executiveTrendApi.addInsightToManagementReview(id),
      onSuccess: refresh,
    }),

    createComparison: useMutation({
      mutationFn: (body: Record<string, unknown>) => executiveTrendApi.createComparison(body),
      onSuccess: refresh,
    }),
    updateSettings: useMutation({
      mutationFn: (body: Record<string, unknown>) => executiveTrendApi.updateSettings(body),
      onSuccess: refresh,
    }),
  };
}
