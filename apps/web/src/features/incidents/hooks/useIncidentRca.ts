import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { incidentRcaService } from '../services/incident-rca.service';
import type { IncidentRcaData } from '../types/incident-rca.types';

export function useIncidentRca(id: string) {
  return useQuery<IncidentRcaData>({ queryKey: ['incidents', 'rca', id], queryFn: () => incidentRcaService.tab(id), enabled: !!id, refetchOnWindowFocus: false });
}

export function useIncidentRcaMutations(id: string) {
  const queryClient = useQueryClient();
  const invalidate = () => Promise.all([
    queryClient.invalidateQueries({ queryKey: ['incidents', 'rca', id] }),
    queryClient.invalidateQueries({ queryKey: ['incidents', 'detail', id] }),
    queryClient.invalidateQueries({ queryKey: ['incidents', 'overview', id] }),
    queryClient.invalidateQueries({ queryKey: ['incidents', 'dashboard'] })
  ]);
  return {
    updateMethod: useMutation({ mutationFn: (values: any) => incidentRcaService.updateMethod(id, values), onSuccess: invalidate }),
    createCausalFactor: useMutation({ mutationFn: (values: any) => incidentRcaService.createCausalFactor(id, values), onSuccess: invalidate }),
    updateCausalFactor: useMutation({ mutationFn: ({ factorId, values }: any) => incidentRcaService.updateCausalFactor(id, factorId, values), onSuccess: invalidate }),
    deleteCausalFactor: useMutation({ mutationFn: ({ factorId, values }: any) => incidentRcaService.deleteCausalFactor(id, factorId, values), onSuccess: invalidate }),
    confirmCausalFactor: useMutation({ mutationFn: ({ factorId, values }: any) => incidentRcaService.confirmCausalFactor(id, factorId, values), onSuccess: invalidate }),
    rejectCausalFactor: useMutation({ mutationFn: ({ factorId, values }: any) => incidentRcaService.rejectCausalFactor(id, factorId, values), onSuccess: invalidate }),
    linkCausalFactorEvidence: useMutation({ mutationFn: ({ factorId, values }: any) => incidentRcaService.linkCausalFactorEvidence(id, factorId, values), onSuccess: invalidate }),
    convertFactorToRootCause: useMutation({ mutationFn: ({ factorId, values }: any) => incidentRcaService.convertFactorToRootCause(id, factorId, values), onSuccess: invalidate }),
    createRootCause: useMutation({ mutationFn: (values: any) => incidentRcaService.createRootCause(id, values), onSuccess: invalidate }),
    updateRootCause: useMutation({ mutationFn: ({ rootCauseId, values }: any) => incidentRcaService.updateRootCause(id, rootCauseId, values), onSuccess: invalidate }),
    deleteRootCause: useMutation({ mutationFn: ({ rootCauseId, values }: any) => incidentRcaService.deleteRootCause(id, rootCauseId, values), onSuccess: invalidate }),
    createCapa: useMutation({ mutationFn: ({ rootCauseId, values }: any) => incidentRcaService.createCapa(id, rootCauseId, values), onSuccess: invalidate }),
    upsertFiveWhyChain: useMutation({ mutationFn: (values: any) => incidentRcaService.upsertFiveWhyChain(id, values), onSuccess: invalidate }),
    upsertFiveWhyStep: useMutation({ mutationFn: (values: any) => incidentRcaService.upsertFiveWhyStep(id, values), onSuccess: invalidate }),
    upsertFishboneItem: useMutation({ mutationFn: (values: any) => incidentRcaService.upsertFishboneItem(id, values), onSuccess: invalidate }),
    upsertCauseTreeNode: useMutation({ mutationFn: (values: any) => incidentRcaService.upsertCauseTreeNode(id, values), onSuccess: invalidate }),
    upsertCauseTreeEdge: useMutation({ mutationFn: (values: any) => incidentRcaService.upsertCauseTreeEdge(id, values), onSuccess: invalidate }),
    upsertSystemicWeakness: useMutation({ mutationFn: (values: any) => incidentRcaService.upsertSystemicWeakness(id, values), onSuccess: invalidate }),
    upsertHypothesis: useMutation({ mutationFn: (values: any) => incidentRcaService.upsertHypothesis(id, values), onSuccess: invalidate }),
    requestReview: useMutation({ mutationFn: (values: any) => incidentRcaService.requestReview(id, values), onSuccess: invalidate }),
    approveReview: useMutation({ mutationFn: (values: any) => incidentRcaService.approveReview(id, values), onSuccess: invalidate }),
    rejectReview: useMutation({ mutationFn: (values: any) => incidentRcaService.rejectReview(id, values), onSuccess: invalidate }),
    complete: useMutation({ mutationFn: (values: any) => incidentRcaService.complete(id, values), onSuccess: invalidate }),
    reopen: useMutation({ mutationFn: (values: any) => incidentRcaService.reopen(id, values), onSuccess: invalidate })
  };
}
