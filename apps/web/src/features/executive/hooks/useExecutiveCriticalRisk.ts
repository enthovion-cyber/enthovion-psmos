import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { executiveCriticalRiskApi } from '../services/executive-critical-risk.service';

export const useExecutiveCriticalRiskDashboard = (params?: Record<string, unknown>) =>
  useQuery({
    queryKey: ['executive', 'critical-risk', 'dashboard', params],
    queryFn: () => executiveCriticalRiskApi.dashboard(params),
    staleTime: 30_000,
  });

export const useExecutiveCriticalRiskCases = (params?: Record<string, unknown>) =>
  useQuery({
    queryKey: ['executive', 'critical-risk', 'cases', params],
    queryFn: () => executiveCriticalRiskApi.cases(params),
  });

export const useExecutiveCriticalRiskDetail = (id: string) =>
  useQuery({
    queryKey: ['executive', 'critical-risk', 'case', id],
    queryFn: () => executiveCriticalRiskApi.caseDetail(id),
    enabled: Boolean(id),
  });

export const useExecutiveCriticalBarriers = (params?: Record<string, unknown>) =>
  useQuery({
    queryKey: ['executive', 'critical-risk', 'barriers', params],
    queryFn: () => executiveCriticalRiskApi.barriers(params),
  });

export const useExecutiveCriticalRiskHistory = (params?: Record<string, unknown>) =>
  useQuery({
    queryKey: ['executive', 'critical-risk', 'history', params],
    queryFn: () => executiveCriticalRiskApi.historyList(params),
  });

export const useExecutiveOverdueActions = (params?: Record<string, unknown>) =>
  useQuery({
    queryKey: ['executive', 'overdue-actions', 'list', params],
    queryFn: () => executiveCriticalRiskApi.overdueActions(params),
  });

export const useExecutiveOverdueActionDetail = (id: string) =>
  useQuery({
    queryKey: ['executive', 'overdue-actions', 'detail', id],
    queryFn: () => executiveCriticalRiskApi.overdueAction(id),
    enabled: Boolean(id),
  });

export const useExecutiveOverdueByOwner = (params?: Record<string, unknown>) =>
  useQuery({
    queryKey: ['executive', 'overdue-actions', 'by-owner', params],
    queryFn: () => executiveCriticalRiskApi.overdueActionsByOwner(params),
  });

export const useExecutiveOverdueBySite = (params?: Record<string, unknown>) =>
  useQuery({
    queryKey: ['executive', 'overdue-actions', 'by-site', params],
    queryFn: () => executiveCriticalRiskApi.overdueActionsBySite(params),
  });

export const useExecutiveOverdueByModule = (params?: Record<string, unknown>) =>
  useQuery({
    queryKey: ['executive', 'overdue-actions', 'by-module', params],
    queryFn: () => executiveCriticalRiskApi.overdueActionsByModule(params),
  });

export const useExecutiveEscalations = (params?: Record<string, unknown>) =>
  useQuery({
    queryKey: ['executive', 'escalations', 'list', params],
    queryFn: () => executiveCriticalRiskApi.escalations(params),
  });

export const useExecutiveEscalationDetail = (id: string) =>
  useQuery({
    queryKey: ['executive', 'escalations', 'detail', id],
    queryFn: () => executiveCriticalRiskApi.escalation(id),
    enabled: Boolean(id),
  });

export const useExecutiveEscalationRules = (params?: Record<string, unknown>) =>
  useQuery({
    queryKey: ['executive', 'escalations', 'rules', params],
    queryFn: () => executiveCriticalRiskApi.rules(params),
  });

export const useExecutiveLeadershipAttention = (params?: Record<string, unknown>) =>
  useQuery({
    queryKey: ['executive', 'leadership-attention', params],
    queryFn: () => executiveCriticalRiskApi.leadership(params),
  });

export const useExecutiveCriticalRiskLookups = (type: string) =>
  useQuery({
    queryKey: ['executive', 'lookups', type],
    queryFn: () => executiveCriticalRiskApi.lookups(type),
    staleTime: 5 * 60_000,
  });

export const useExecutiveCriticalRiskMutation = () => {
  const client = useQueryClient();
  const invalidateAll = () => {
    void client.invalidateQueries({ queryKey: ['executive', 'critical-risk'] });
    void client.invalidateQueries({ queryKey: ['executive', 'overdue-actions'] });
    void client.invalidateQueries({ queryKey: ['executive', 'leadership-attention'] });
  };

  return {
    recalculate: useMutation({
      mutationFn: (body?: Record<string, unknown> | void) => executiveCriticalRiskApi.recalculate(body || undefined),
      onSuccess: invalidateAll,
    }),
    acknowledge: useMutation({
      mutationFn: ({ id, note }: { id: string; note?: string | undefined }) =>
        executiveCriticalRiskApi.acknowledge(id, note),
      onSuccess: invalidateAll,
    }),
    assignOwner: useMutation({
      mutationFn: ({ id, ownerId, reason }: { id: string; ownerId: string; reason: string }) =>
        executiveCriticalRiskApi.assignOwner(id, { ownerId, reason }),
      onSuccess: invalidateAll,
    }),
    createAction: useMutation({
      mutationFn: ({ id, body }: { id: string; body: Record<string, unknown> }) =>
        executiveCriticalRiskApi.createAction(id, body),
      onSuccess: invalidateAll,
    }),
    linkAction: useMutation({
      mutationFn: ({ id, actionId }: { id: string; actionId: string }) =>
        executiveCriticalRiskApi.linkAction(id, { actionId }),
      onSuccess: invalidateAll,
    }),
    requestVerification: useMutation({
      mutationFn: ({ id, verifierId, criteria }: { id: string; verifierId: string; criteria?: string | undefined }) =>
        executiveCriticalRiskApi.requestVerification(id, { verifierId, ...(criteria ? { criteria } : {}) }),
      onSuccess: invalidateAll,
    }),
    closeCase: useMutation({
      mutationFn: ({ id, reason }: { id: string; reason: string }) => executiveCriticalRiskApi.close(id, reason),
      onSuccess: invalidateAll,
    }),
  };
};

export const useExecutiveEscalationMutation = () => {
  const client = useQueryClient();
  const invalidateAll = () => {
    void client.invalidateQueries({ queryKey: ['executive', 'escalations'] });
    void client.invalidateQueries({ queryKey: ['executive', 'critical-risk'] });
    void client.invalidateQueries({ queryKey: ['executive', 'leadership-attention'] });
  };

  return {
    create: useMutation({
      mutationFn: (body: Record<string, unknown>) => executiveCriticalRiskApi.createEscalation(body),
      onSuccess: invalidateAll,
    }),
    acknowledge: useMutation({
      mutationFn: ({ id, note }: { id: string; note?: string | undefined }) =>
        executiveCriticalRiskApi.acknowledgeEscalation(id, note),
      onSuccess: invalidateAll,
    }),
    recordDecision: useMutation({
      mutationFn: ({
        id,
        body,
      }: {
        id: string;
        body: { decision: string; decisionType?: string | undefined; rationale?: string | undefined };
      }) =>
        executiveCriticalRiskApi.decision(id, {
          decision: body.decision,
          ...(body.decisionType ? { decisionType: body.decisionType } : {}),
          ...(body.rationale ? { rationale: body.rationale } : {}),
        }),
      onSuccess: invalidateAll,
    }),
    reassign: useMutation({
      mutationFn: ({ id, recipientUserId }: { id: string; recipientUserId: string }) =>
        executiveCriticalRiskApi.reassignEscalation(id, { recipientUserId }),
      onSuccess: invalidateAll,
    }),
    advanceLevel: useMutation({
      mutationFn: ({ id, reason }: { id: string; reason?: string | undefined }) =>
        executiveCriticalRiskApi.advanceEscalationLevel(id, { ...(reason ? { reason } : {}) }),
      onSuccess: invalidateAll,
    }),
    cancel: useMutation({
      mutationFn: ({ id, reason }: { id: string; reason: string }) =>
        executiveCriticalRiskApi.cancelEscalation(id, { reason }),
      onSuccess: invalidateAll,
    }),
    close: useMutation({
      mutationFn: ({ id, reason }: { id: string; reason: string }) =>
        executiveCriticalRiskApi.closeEscalation(id, reason),
      onSuccess: invalidateAll,
    }),
    saveRule: useMutation({
      mutationFn: ({ body, id }: { body: Record<string, unknown>; id?: string | undefined }) =>
        executiveCriticalRiskApi.saveRule(body, id),
      onSuccess: () => void client.invalidateQueries({ queryKey: ['executive', 'escalations', 'rules'] }),
    }),
    approveRule: useMutation({
      mutationFn: (id: string) => executiveCriticalRiskApi.approveRule(id),
      onSuccess: () => void client.invalidateQueries({ queryKey: ['executive', 'escalations', 'rules'] }),
    }),
    archiveRule: useMutation({
      mutationFn: ({ id, reason }: { id: string; reason?: string | undefined }) =>
        executiveCriticalRiskApi.archiveRule(id, { ...(reason ? { reason } : {}) }),
      onSuccess: () => void client.invalidateQueries({ queryKey: ['executive', 'escalations', 'rules'] }),
    }),
  };
};
