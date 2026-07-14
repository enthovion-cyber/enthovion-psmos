import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { lopaService } from '../services/lopa.service';
import type { LopaCreateValues } from '../types/lopa.types';

export function useLopaDashboard(filters: Record<string, any>) {
  const params = Object.fromEntries(Object.entries(filters).filter(([, value]) => value !== '' && value !== false && value !== undefined));
  return {
    summary: useQuery({ queryKey: ['lopa', 'summary'], queryFn: lopaService.summary }),
    register: useQuery({ queryKey: ['lopa', 'register', params], queryFn: () => lopaService.list(params) }),
    attention: useQuery({ queryKey: ['lopa', 'attention'], queryFn: lopaService.attention }),
    hazopScenarios: useQuery({ queryKey: ['lopa', 'hazop-required'], queryFn: lopaService.hazopRequiredScenarios })
  };
}

export function useLopaCreateContext() {
  return useQuery({ queryKey: ['lopa', 'create-context'], queryFn: lopaService.createContext });
}

export function useLopaCreateTeamSuggestions(params: Record<string, any>) {
  return useQuery({ queryKey: ['lopa', 'create-team-suggestions', params], queryFn: () => lopaService.teamSuggestions(params), enabled: !!params.siteId || !!params.hazopScenarioId || !!params.ownerId });
}

export function useLopaCreateUserSearch(q: string, siteId?: string, unitId?: string, areaId?: string) {
  return useQuery({ queryKey: ['lopa', 'create-user-search', q, siteId, unitId, areaId], queryFn: () => lopaService.userSearch({ q, siteId, unitId, areaId }), enabled: q.trim().length >= 2 });
}

export function useLopaCreateOwnerProfile(ownerId?: string, params: Record<string, any> = {}) {
  return useQuery({ queryKey: ['lopa', 'create-owner-profile', ownerId, params.siteId, params.unitId, params.areaId], queryFn: () => lopaService.ownerProfile(ownerId!, params), enabled: !!ownerId });
}

export function useLopaHazopScenario(scenarioId?: string) {
  return useQuery({ queryKey: ['lopa', 'hazop-scenario', scenarioId], queryFn: () => lopaService.hazopScenario(scenarioId!), enabled: !!scenarioId });
}

export function useLopaCreateMutations() {
  const queryClient = useQueryClient();
  const onSuccess = () => {
    void queryClient.invalidateQueries({ queryKey: ['lopa'] });
    void queryClient.invalidateQueries({ queryKey: ['hazop'] });
  };
  return {
    create: useMutation({ mutationFn: (values: LopaCreateValues) => lopaService.create(values), onSuccess }),
    saveDraft: useMutation({ mutationFn: (values: LopaCreateValues) => lopaService.saveDraft(values), onSuccess }),
    createFromHazop: useMutation({ mutationFn: (values: LopaCreateValues & { hazopScenarioId: string }) => lopaService.createFromHazop(values.hazopScenarioId, values), onSuccess }),
    sendInvitations: useMutation({ mutationFn: ({ id, message }: { id: string; message?: string }) => lopaService.sendInvitations(id, message ? { message } : {}), onSuccess })
  };
}
