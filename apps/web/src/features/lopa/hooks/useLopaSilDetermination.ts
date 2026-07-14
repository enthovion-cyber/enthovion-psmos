import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { lopaSilDeterminationService } from '../services/lopa-sil-determination.service';
import type { LopaSifComponentInput, LopaSifInput, LopaSilActionCreateInput, LopaSilActionInput, LopaSilLinkInput } from '../types/lopa-sil-determination.types';

export function useLopaSilDetermination(id: string) {
  return useQuery({ queryKey: ['lopa', 'sil-determination', id], queryFn: () => lopaSilDeterminationService.get(id), enabled: !!id });
}
export function useLopaSilDeterminationMutations(id: string) {
  const client = useQueryClient();
  const refresh = () => { void client.invalidateQueries({ queryKey: ['lopa', 'sil-determination', id] }); void client.invalidateQueries({ queryKey: ['lopa', 'overview', id] }); void client.invalidateQueries({ queryKey: ['lopa', 'risk-calculation', id] }); };
  return {
    determine: useMutation({ mutationFn: (v: LopaSilActionInput) => lopaSilDeterminationService.determine(id, v), onSuccess: refresh }),
    reassess: useMutation({ mutationFn: (v: LopaSilActionInput) => lopaSilDeterminationService.reassess(id, v), onSuccess: refresh }),
    override: useMutation({ mutationFn: ({ determinationId, values }: { determinationId: string; values: LopaSilActionInput }) => lopaSilDeterminationService.override(id, determinationId, values), onSuccess: refresh }),
    lock: useMutation({ mutationFn: (v: LopaSilActionInput) => lopaSilDeterminationService.lock(id, v), onSuccess: refresh }),
    unlock: useMutation({ mutationFn: (v: LopaSilActionInput) => lopaSilDeterminationService.unlock(id, v), onSuccess: refresh }),
    createSif: useMutation({ mutationFn: (v: LopaSifInput) => lopaSilDeterminationService.createSif(id, v), onSuccess: refresh }),
    updateSif: useMutation({ mutationFn: ({ sifId, values }: { sifId: string; values: LopaSifInput }) => lopaSilDeterminationService.updateSif(id, sifId, values), onSuccess: refresh }),
    deleteSif: useMutation({ mutationFn: ({ sifId, reason }: { sifId: string; reason: string }) => lopaSilDeterminationService.deleteSif(id, sifId, reason), onSuccess: refresh }),
    addComponent: useMutation({ mutationFn: ({ sifId, values }: { sifId: string; values: LopaSifComponentInput }) => lopaSilDeterminationService.addComponent(id, sifId, values), onSuccess: refresh }),
    updateArchitecture: useMutation({ mutationFn: ({ sifId, values }: { sifId: string; values: Record<string, unknown> }) => lopaSilDeterminationService.updateArchitecture(id, sifId, values), onSuccess: refresh }),
    updateProofTest: useMutation({ mutationFn: ({ sifId, values }: { sifId: string; values: Record<string, unknown> }) => lopaSilDeterminationService.updateProofTest(id, sifId, values), onSuccess: refresh }),
    generateGaps: useMutation({ mutationFn: () => lopaSilDeterminationService.generateGaps(id), onSuccess: refresh }),
    updateGap: useMutation({ mutationFn: ({ gapId, values }: { gapId: string; values: Record<string, unknown> }) => lopaSilDeterminationService.updateGap(id, gapId, values), onSuccess: refresh }),
    acceptGapException: useMutation({ mutationFn: ({ gapId, reason }: { gapId: string; reason: string }) => lopaSilDeterminationService.acceptGapException(id, gapId, reason), onSuccess: refresh }),
    addLink: useMutation({ mutationFn: (values: LopaSilLinkInput) => lopaSilDeterminationService.addLink(id, values), onSuccess: refresh }),
    createAction: useMutation({ mutationFn: (values: LopaSilActionCreateInput) => lopaSilDeterminationService.createAction(id, values), onSuccess: refresh }),
    compareSnapshot: useMutation({ mutationFn: (snapshotId: string) => lopaSilDeterminationService.compareSnapshot(id, snapshotId) }),
    checkReassessment: useMutation({ mutationFn: () => lopaSilDeterminationService.checkReassessment(id), onSuccess: refresh })
  };
}
