import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { regulatoryObligationService } from '../services/regulatory-obligation.service';

export function useRegulatoryObligationDashboard(filters?: Record<string, unknown>) {
  return useQuery({ queryKey: ['regulatory', 'obligations', 'dashboard', filters], queryFn: () => regulatoryObligationService.dashboard(filters), refetchOnWindowFocus: false });
}

export function useRegulatoryObligations(filters?: Record<string, unknown>, view?: string) {
  return useQuery({ queryKey: ['regulatory', 'obligations', view ?? 'register', filters], queryFn: () => view ? regulatoryObligationService.filtered(view, filters) : regulatoryObligationService.register(filters), refetchOnWindowFocus: false });
}

export function useRegulatoryObligationMatrix(filters?: Record<string, unknown>) {
  return useQuery({ queryKey: ['regulatory', 'obligations', 'matrix', filters], queryFn: () => regulatoryObligationService.matrix(filters), refetchOnWindowFocus: false });
}

export function useRegulatoryObligationGaps(filters?: Record<string, unknown>) {
  return useQuery({ queryKey: ['regulatory', 'obligations', 'gaps', filters], queryFn: () => regulatoryObligationService.gaps(filters), refetchOnWindowFocus: false });
}

export function useRegulatoryObligation(id?: string) {
  return useQuery({ queryKey: ['regulatory', 'obligations', 'detail', id], queryFn: () => regulatoryObligationService.detail(id as string), enabled: Boolean(id), refetchOnWindowFocus: false });
}

export function useRegulatoryObligationSection(id?: string, section?: string) {
  return useQuery({ queryKey: ['regulatory', 'obligations', 'section', id, section], queryFn: () => regulatoryObligationService.section(id as string, section as string), enabled: Boolean(id && section), refetchOnWindowFocus: false });
}

export function useRegulatoryObligationLookups() {
  return useQuery({ queryKey: ['regulatory', 'obligations', 'lookups'], queryFn: () => regulatoryObligationService.lookups(), staleTime: 15 * 60_000 });
}

export function useRegulatoryObligationMutations() {
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['regulatory', 'obligations'] });
  return {
    create: useMutation({ mutationFn: regulatoryObligationService.create, onSuccess: invalidate }),
    update: useMutation({ mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) => regulatoryObligationService.update(id, data), onSuccess: invalidate }),
    archive: useMutation({ mutationFn: ({ id, reason }: { id: string; reason: string }) => regulatoryObligationService.archive(id, reason), onSuccess: invalidate }),
    assignOwner: useMutation({ mutationFn: ({ id, ownerUserId, reason }: { id: string; ownerUserId: string; reason: string }) => regulatoryObligationService.assignOwner(id, ownerUserId, reason), onSuccess: invalidate }),
    detectGaps: useMutation({ mutationFn: regulatoryObligationService.detectGaps, onSuccess: invalidate }),
    resolveGap: useMutation({ mutationFn: ({ gapId, reason }: { gapId: string; reason: string }) => regulatoryObligationService.resolveGap(gapId, reason), onSuccess: invalidate })
  };
}
