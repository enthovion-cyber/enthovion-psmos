import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ptwAuthorizationService } from '../services/ptw-authorization.service';

export function usePtwAuthorizationDashboard(params: Record<string, unknown> = {}) {
  return useQuery({ queryKey: ['training', 'ptw-authorization', 'dashboard', params], queryFn: () => ptwAuthorizationService.dashboard(params) });
}

export function usePtwAuthorizationLookups() {
  return useQuery({ queryKey: ['training', 'ptw-authorization', 'lookups'], queryFn: () => ptwAuthorizationService.lookups() });
}

export function usePtwAuthorizationRules(params: Record<string, unknown> = {}) {
  return useQuery({ queryKey: ['training', 'ptw-authorization', 'rules', params], queryFn: () => ptwAuthorizationService.rules(params) });
}

export function usePtwAuthorizationRule(ruleId?: string) {
  return useQuery({ queryKey: ['training', 'ptw-authorization', 'rules', ruleId], queryFn: () => ptwAuthorizationService.rule(ruleId!), enabled: Boolean(ruleId) });
}

export function usePtwAuthorizationRecords(params: Record<string, unknown> = {}) {
  return useQuery({ queryKey: ['training', 'ptw-authorization', 'records', params], queryFn: () => ptwAuthorizationService.authorizations(params) });
}

export function usePtwAuthorizationRequests(params: Record<string, unknown> = {}) {
  return useQuery({ queryKey: ['training', 'ptw-authorization', 'requests', params], queryFn: () => ptwAuthorizationService.requests(params) });
}

export function usePtwAuthorizationEvaluations(params: Record<string, unknown> = {}) {
  return useQuery({ queryKey: ['training', 'ptw-authorization', 'evaluations', params], queryFn: () => ptwAuthorizationService.evaluations(params) });
}

export function usePtwAuthorizationGaps(params: Record<string, unknown> = {}) {
  return useQuery({ queryKey: ['training', 'ptw-authorization', 'gaps', params], queryFn: () => ptwAuthorizationService.gaps(params) });
}

export function usePtwAuthorizationWaivers(params: Record<string, unknown> = {}) {
  return useQuery({ queryKey: ['training', 'ptw-authorization', 'waivers', params], queryFn: () => ptwAuthorizationService.waivers(params) });
}

export function usePtwAuthorizationHistory(params: Record<string, unknown> = {}) {
  return useQuery({ queryKey: ['training', 'ptw-authorization', 'history', params], queryFn: () => ptwAuthorizationService.history(params) });
}

export function usePtwAuthorizationSettings(params: Record<string, unknown> = {}) {
  return useQuery({ queryKey: ['training', 'ptw-authorization', 'settings', params], queryFn: () => ptwAuthorizationService.settings(params) });
}

export function usePtwAuthorizationWorker(workerId: string, view: 'authorizations' | 'gaps' | 'history') {
  return useQuery({
    queryKey: ['training', 'ptw-authorization', 'worker', workerId, view],
    queryFn: () => view === 'gaps' ? ptwAuthorizationService.workerGaps(workerId) : view === 'history' ? ptwAuthorizationService.workerHistory(workerId) : ptwAuthorizationService.workerAuthorizations(workerId),
    enabled: Boolean(workerId)
  });
}

export function usePtwAuthorizationScoped(scope: 'sites' | 'units' | 'areas', id: string) {
  return useQuery({ queryKey: ['training', 'ptw-authorization', 'scope', scope, id], queryFn: () => ptwAuthorizationService.scoped(scope, id), enabled: Boolean(id) });
}

export function usePtwAuthorizationMutations() {
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['training', 'ptw-authorization'] });
  return {
    createRule: useMutation({ mutationFn: ptwAuthorizationService.createRule, onSuccess: invalidate }),
    updateRule: useMutation({ mutationFn: ({ ruleId, data }: { ruleId: string; data: Record<string, unknown> }) => ptwAuthorizationService.updateRule(ruleId, data), onSuccess: invalidate }),
    createAuthorization: useMutation({ mutationFn: ptwAuthorizationService.createAuthorization, onSuccess: invalidate }),
    createRequest: useMutation({ mutationFn: ptwAuthorizationService.createRequest, onSuccess: invalidate }),
    runEvaluation: useMutation({ mutationFn: ptwAuthorizationService.runEvaluation, onSuccess: invalidate }),
    updateSettings: useMutation({ mutationFn: ptwAuthorizationService.updateSettings, onSuccess: invalidate })
  };
}
