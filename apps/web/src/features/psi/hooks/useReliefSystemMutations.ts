import { useMutation, useQueryClient } from '@tanstack/react-query';
import { reliefSystemService } from '../services/relief-system.service';
import { reliefScenarioService } from '../services/relief-scenario.service';
import { reliefCompletenessService } from '../services/relief-completeness.service';
import { reliefConflictService } from '../services/relief-conflict.service';
import { reliefMiSyncService } from '../services/relief-mi-sync.service';

export function useReliefSystemMutations(reliefBasisId?: string | undefined, forcedUnitId?: string | undefined) {
  const queryClient = useQueryClient();
  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: ['psi', 'relief-system', reliefBasisId] });
    await queryClient.invalidateQueries({ queryKey: ['psi', 'relief-systems'] });
  };

  return {
    create: useMutation({
      mutationFn: (input: Record<string, unknown>) => forcedUnitId ? reliefSystemService.createForUnit(forcedUnitId, input) : reliefSystemService.create(input),
      onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: ['psi', 'relief-systems'] }); }
    }),
    update: useMutation({ mutationFn: (input: Record<string, unknown>) => reliefSystemService.update(reliefBasisId as string, input), onSuccess: invalidate }),
    archive: useMutation({ mutationFn: (input: Record<string, unknown>) => reliefSystemService.archive(reliefBasisId as string, input), onSuccess: invalidate }),
    reactivate: useMutation({ mutationFn: (input: Record<string, unknown>) => reliefSystemService.reactivate(reliefBasisId as string, input), onSuccess: invalidate }),
    clone: useMutation({ mutationFn: (input: Record<string, unknown>) => reliefSystemService.clone(reliefBasisId as string, input), onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: ['psi', 'relief-systems'] }); } }),
    upsertProtectedEquipment: useMutation({ mutationFn: (input: Record<string, unknown>) => reliefSystemService.upsertProtectedEquipment(reliefBasisId as string, input), onSuccess: invalidate }),
    linkDevice: useMutation({ mutationFn: (input: Record<string, unknown>) => reliefSystemService.linkDevice(reliefBasisId as string, input), onSuccess: invalidate }),
    upsertSizing: useMutation({ mutationFn: (input: Record<string, unknown>) => reliefSystemService.upsertSizing(reliefBasisId as string, input), onSuccess: invalidate }),
    upsertDischarge: useMutation({ mutationFn: (input: Record<string, unknown>) => reliefSystemService.upsertDischarge(reliefBasisId as string, input), onSuccess: invalidate }),
    createScenario: useMutation({ mutationFn: (input: Record<string, unknown>) => reliefScenarioService.create(reliefBasisId as string, input), onSuccess: invalidate }),
    runCompleteness: useMutation({ mutationFn: () => reliefCompletenessService.run(reliefBasisId as string), onSuccess: invalidate }),
    runConflictCheck: useMutation({ mutationFn: () => reliefConflictService.run(reliefBasisId as string), onSuccess: invalidate }),
    compareMi: useMutation({ mutationFn: () => reliefMiSyncService.compareOnly(reliefBasisId as string), onSuccess: invalidate }),
    syncFromMi: useMutation({ mutationFn: (input: Record<string, unknown>) => reliefMiSyncService.fromMi(reliefBasisId as string, input), onSuccess: invalidate }),
    syncToMi: useMutation({ mutationFn: (input: Record<string, unknown>) => reliefMiSyncService.toMi(reliefBasisId as string, input), onSuccess: invalidate }),
    submitReview: useMutation({ mutationFn: (input: Record<string, unknown>) => reliefSystemService.submitReview(reliefBasisId as string, input), onSuccess: invalidate })
  };
}
