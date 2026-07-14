'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { hazopSafeguardService } from '../services/hazop-safeguard.service';

export function useHazopSafeguardMutations(studyId: string) {
  const queryClient = useQueryClient();
  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ['hazop'] });
    void queryClient.invalidateQueries({ queryKey: ['hazop', studyId] });
    void queryClient.invalidateQueries({ queryKey: ['hazop', studyId, 'safeguards-summary'] });
    void queryClient.invalidateQueries({ queryKey: ['hazop', studyId, 'safeguards-register'] });
    void queryClient.invalidateQueries({ queryKey: ['hazop', studyId, 'safeguards-ipl-candidates'] });
    void queryClient.invalidateQueries({ queryKey: ['hazop', studyId, 'safeguard-gaps'] });
    void queryClient.invalidateQueries({ queryKey: ['hazop', studyId, 'safeguards-proof-tests'] });
  };
  return {
    add: useMutation({ mutationFn: ({ scenarioId, values }: { scenarioId: string; values: Record<string, any> }) => hazopSafeguardService.add(studyId, scenarioId, values), onSuccess: invalidate }),
    update: useMutation({ mutationFn: ({ safeguardId, values }: { safeguardId: string; values: Record<string, any> }) => hazopSafeguardService.update(studyId, safeguardId, values), onSuccess: invalidate }),
    delete: useMutation({ mutationFn: (safeguardId: string) => hazopSafeguardService.delete(studyId, safeguardId), onSuccess: invalidate }),
    markIpl: useMutation({ mutationFn: (safeguardId: string) => hazopSafeguardService.markIpl(studyId, safeguardId), onSuccess: invalidate }),
    markCredited: useMutation({ mutationFn: (safeguardId: string) => hazopSafeguardService.markCredited(studyId, safeguardId), onSuccess: invalidate }),
    markNotCredited: useMutation({ mutationFn: (safeguardId: string) => hazopSafeguardService.markNotCredited(studyId, safeguardId), onSuccess: invalidate }),
    linkEquipment: useMutation({ mutationFn: ({ safeguardId, values }: { safeguardId: string; values: Record<string, any> }) => hazopSafeguardService.linkEquipment(studyId, safeguardId, values), onSuccess: invalidate }),
    linkDocument: useMutation({ mutationFn: ({ safeguardId, values }: { safeguardId: string; values: Record<string, any> }) => hazopSafeguardService.linkDocument(studyId, safeguardId, values), onSuccess: invalidate }),
    updateTestStatus: useMutation({ mutationFn: ({ safeguardId, values }: { safeguardId: string; values: Record<string, any> }) => hazopSafeguardService.updateTestStatus(studyId, safeguardId, values), onSuccess: invalidate }),
    createGap: useMutation({ mutationFn: ({ safeguardId, values }: { safeguardId: string; values: Record<string, any> }) => hazopSafeguardService.createGap(studyId, safeguardId, values), onSuccess: invalidate }),
    createGapAction: useMutation({ mutationFn: ({ gapId, values }: { gapId: string; values: Record<string, any> }) => hazopSafeguardService.createGapAction(studyId, gapId, values), onSuccess: invalidate }),
    closeGap: useMutation({ mutationFn: (gapId: string) => hazopSafeguardService.closeGap(studyId, gapId), onSuccess: invalidate }),
    exportRegister: useMutation({ mutationFn: () => hazopSafeguardService.export(studyId) })
  };
}
