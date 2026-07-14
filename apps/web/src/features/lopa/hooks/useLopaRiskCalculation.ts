import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { lopaRiskCalculationService } from '../services/lopa-risk-calculation.service';
import type { LopaRiskCalculationActionInput, LopaRiskCalculationAssumptionInput, LopaRiskCalculationFilters, LopaRiskCalculationGapInput } from '../types/lopa-risk-calculation.types';

export function useLopaRiskCalculation(id: string, filters: LopaRiskCalculationFilters = {}) {
  return useQuery({
    queryKey: ['lopa', 'risk-calculation', id, filters],
    queryFn: () => lopaRiskCalculationService.get(id, filters),
    enabled: !!id
  });
}

export function useLopaRiskCalculationMutations(id: string) {
  const qc = useQueryClient();
  const refresh = () => {
    void qc.invalidateQueries({ queryKey: ['lopa', 'risk-calculation', id] });
    void qc.invalidateQueries({ queryKey: ['lopa', 'overview', id] });
    void qc.invalidateQueries({ queryKey: ['lopa', 'detail', id] });
    void qc.invalidateQueries({ queryKey: ['lopa', 'ipls-safeguards', id] });
  };
  return {
    calculate: useMutation({ mutationFn: (values: LopaRiskCalculationActionInput) => lopaRiskCalculationService.calculate(id, values), onSuccess: refresh }),
    recalculate: useMutation({ mutationFn: (values: LopaRiskCalculationActionInput) => lopaRiskCalculationService.recalculate(id, values), onSuccess: refresh }),
    saveSnapshot: useMutation({ mutationFn: (values: LopaRiskCalculationActionInput) => lopaRiskCalculationService.saveSnapshot(id, values), onSuccess: refresh }),
    lock: useMutation({ mutationFn: (reason?: string) => lopaRiskCalculationService.lock(id, reason), onSuccess: refresh }),
    unlock: useMutation({ mutationFn: (reason?: string) => lopaRiskCalculationService.unlock(id, reason), onSuccess: refresh }),
    createAssumption: useMutation({ mutationFn: (values: LopaRiskCalculationAssumptionInput) => lopaRiskCalculationService.createAssumption(id, values), onSuccess: refresh }),
    updateAssumption: useMutation({ mutationFn: ({ assumptionId, values }: { assumptionId: string; values: LopaRiskCalculationAssumptionInput }) => lopaRiskCalculationService.updateAssumption(id, assumptionId, values), onSuccess: refresh }),
    deleteAssumption: useMutation({ mutationFn: (assumptionId: string) => lopaRiskCalculationService.deleteAssumption(id, assumptionId), onSuccess: refresh }),
    createGap: useMutation({ mutationFn: (values: LopaRiskCalculationGapInput) => lopaRiskCalculationService.createGap(id, values), onSuccess: refresh }),
    createGapAction: useMutation({ mutationFn: (gapId: string) => lopaRiskCalculationService.createGapAction(id, gapId), onSuccess: refresh }),
    createRiskGapAction: useMutation({ mutationFn: () => lopaRiskCalculationService.createRiskGapAction(id), onSuccess: refresh }),
    createMissingInputActions: useMutation({ mutationFn: () => lopaRiskCalculationService.createMissingInputActions(id), onSuccess: refresh }),
    export: useMutation({ mutationFn: (filters: LopaRiskCalculationFilters) => lopaRiskCalculationService.export(id, filters) })
  };
}
