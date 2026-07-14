import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { lopaIplsSafeguardsService } from '../services/lopa-ipls-safeguards.service';
import type { LopaIplCandidateInput, LopaIplsSafeguardsFilters, LopaStudySafeguardInput } from '../types/lopa-ipls-safeguards.types';

export function useLopaIplsSafeguards(id: string, filters: LopaIplsSafeguardsFilters = {}) {
  return useQuery({
    queryKey: ['lopa', 'ipls-safeguards', id, filters],
    queryFn: () => lopaIplsSafeguardsService.get(id, filters),
    enabled: !!id
  });
}

export function useLopaIplsSafeguardsMutations(id: string) {
  const qc = useQueryClient();
  const refresh = () => {
    void qc.invalidateQueries({ queryKey: ['lopa', 'ipls-safeguards', id] });
    void qc.invalidateQueries({ queryKey: ['lopa', 'overview', id] });
    void qc.invalidateQueries({ queryKey: ['lopa', 'detail', id] });
  };
  return {
    importHazop: useMutation({ mutationFn: () => lopaIplsSafeguardsService.importHazop(id), onSuccess: refresh }),
    createSafeguard: useMutation({ mutationFn: (values: LopaStudySafeguardInput) => lopaIplsSafeguardsService.createSafeguard(id, values), onSuccess: refresh }),
    updateSafeguard: useMutation({ mutationFn: ({ safeguardId, values }: { safeguardId: string; values: Partial<LopaStudySafeguardInput> }) => lopaIplsSafeguardsService.updateSafeguard(id, safeguardId, values), onSuccess: refresh }),
    markCandidate: useMutation({ mutationFn: ({ safeguardId, values }: { safeguardId: string; values: LopaIplCandidateInput }) => lopaIplsSafeguardsService.markCandidate(id, safeguardId, values), onSuccess: refresh }),
    rejectSafeguard: useMutation({ mutationFn: ({ safeguardId, reason }: { safeguardId: string; reason: string }) => lopaIplsSafeguardsService.rejectSafeguard(id, safeguardId, reason), onSuccess: refresh }),
    createCandidate: useMutation({ mutationFn: (values: LopaIplCandidateInput) => lopaIplsSafeguardsService.createCandidate(id, values), onSuccess: refresh }),
    updateCandidate: useMutation({ mutationFn: ({ candidateId, values }: { candidateId: string; values: Partial<LopaIplCandidateInput> }) => lopaIplsSafeguardsService.updateCandidate(id, candidateId, values), onSuccess: refresh }),
    selectRegistry: useMutation({ mutationFn: (registryIplId: string) => lopaIplsSafeguardsService.selectRegistry(id, registryIplId), onSuccess: refresh }),
    startValidation: useMutation({ mutationFn: (candidateId: string) => lopaIplsSafeguardsService.startValidation(id, candidateId), onSuccess: refresh }),
    submitValidation: useMutation({ mutationFn: (candidateId: string) => lopaIplsSafeguardsService.submitValidation(id, candidateId), onSuccess: refresh }),
    approveCredit: useMutation({ mutationFn: ({ candidateId, reason }: { candidateId: string; reason: string | undefined }) => lopaIplsSafeguardsService.approveCredit(id, candidateId, reason), onSuccess: refresh }),
    removeCredit: useMutation({ mutationFn: ({ candidateId, reason }: { candidateId: string; reason: string | undefined }) => lopaIplsSafeguardsService.removeCredit(id, candidateId, reason), onSuccess: refresh }),
    rejectCandidate: useMutation({ mutationFn: ({ candidateId, reason }: { candidateId: string; reason: string | undefined }) => lopaIplsSafeguardsService.rejectCandidate(id, candidateId, reason), onSuccess: refresh }),
    reopenValidation: useMutation({ mutationFn: ({ candidateId, reason }: { candidateId: string; reason: string | undefined }) => lopaIplsSafeguardsService.reopenValidation(id, candidateId, reason), onSuccess: refresh }),
    createGapActions: useMutation({ mutationFn: () => lopaIplsSafeguardsService.createGapActions(id), onSuccess: refresh })
  };
}
