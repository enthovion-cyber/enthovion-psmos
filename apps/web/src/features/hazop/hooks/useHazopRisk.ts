'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { hazopService } from '../services/hazop.service';

export function useHazopRisk(studyId: string, filters: Record<string, any>) {
  const enabled = Boolean(studyId);
  return {
    summary: useQuery({ queryKey: ['hazop', studyId, 'risk-summary'], queryFn: () => hazopService.riskSummary(studyId), enabled }),
    matrix: useQuery({ queryKey: ['hazop', studyId, 'risk-matrix'], queryFn: () => hazopService.riskMatrix(studyId), enabled }),
    register: useQuery({ queryKey: ['hazop', studyId, 'risk-register', filters], queryFn: () => hazopService.riskRegister(studyId, filters), enabled }),
    highCritical: useQuery({ queryKey: ['hazop', studyId, 'risk-high-critical'], queryFn: () => hazopService.highCriticalRisk(studyId), enabled }),
    lopaTriggers: useQuery({ queryKey: ['hazop', studyId, 'risk-lopa'], queryFn: () => hazopService.lopaTriggers(studyId), enabled }),
    history: useQuery({ queryKey: ['hazop', studyId, 'risk-history'], queryFn: () => hazopService.riskHistory(studyId, { limit: 80 }), enabled }),
    acceptances: useQuery({ queryKey: ['hazop', studyId, 'risk-acceptances'], queryFn: () => hazopService.riskAcceptances(studyId), enabled })
  };
}

export function useHazopRiskMutations(studyId: string) {
  const queryClient = useQueryClient();
  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ['hazop'] });
    void queryClient.invalidateQueries({ queryKey: ['hazop', studyId] });
    void queryClient.invalidateQueries({ queryKey: ['hazop', studyId, 'risk-summary'] });
    void queryClient.invalidateQueries({ queryKey: ['hazop', studyId, 'risk-matrix'] });
    void queryClient.invalidateQueries({ queryKey: ['hazop', studyId, 'risk-register'] });
    void queryClient.invalidateQueries({ queryKey: ['hazop', studyId, 'risk-high-critical'] });
    void queryClient.invalidateQueries({ queryKey: ['hazop', studyId, 'risk-lopa'] });
    void queryClient.invalidateQueries({ queryKey: ['hazop', studyId, 'risk-history'] });
    void queryClient.invalidateQueries({ queryKey: ['hazop', studyId, 'risk-acceptances'] });
  };
  return {
    updateRisk: useMutation({ mutationFn: ({ scenarioId, values }: { scenarioId: string; values: Record<string, any> }) => hazopService.updateScenarioRisk(studyId, scenarioId, values), onSuccess: invalidate }),
    recalculate: useMutation({ mutationFn: (scenarioId: string) => hazopService.recalculateScenarioRisk(studyId, scenarioId), onSuccess: invalidate }),
    markLopa: useMutation({ mutationFn: ({ scenarioId, reason }: { scenarioId: string; reason: string }) => hazopService.markScenarioLopaRequired(studyId, scenarioId, reason), onSuccess: invalidate }),
    clearLopa: useMutation({ mutationFn: ({ scenarioId, reason }: { scenarioId: string; reason: string }) => hazopService.clearScenarioLopaRequired(studyId, scenarioId, reason), onSuccess: invalidate }),
    requestAcceptance: useMutation({ mutationFn: ({ scenarioId, values }: { scenarioId: string; values: Record<string, any> }) => hazopService.requestRiskAcceptance(studyId, scenarioId, values), onSuccess: invalidate }),
    updateAcceptance: useMutation({ mutationFn: ({ acceptanceId, values }: { acceptanceId: string; values: Record<string, any> }) => hazopService.updateRiskAcceptance(studyId, acceptanceId, values), onSuccess: invalidate }),
    approveAcceptance: useMutation({ mutationFn: ({ acceptanceId, values }: { acceptanceId: string; values?: Record<string, any> }) => hazopService.approveRiskAcceptance(studyId, acceptanceId, values), onSuccess: invalidate }),
    rejectAcceptance: useMutation({ mutationFn: ({ acceptanceId, values }: { acceptanceId: string; values?: Record<string, any> }) => hazopService.rejectRiskAcceptance(studyId, acceptanceId, values), onSuccess: invalidate }),
    expireAcceptance: useMutation({ mutationFn: ({ acceptanceId, values }: { acceptanceId: string; values?: Record<string, any> }) => hazopService.expireRiskAcceptance(studyId, acceptanceId, values), onSuccess: invalidate }),
    bulkOwner: useMutation({ mutationFn: (values: Record<string, any>) => hazopService.bulkUpdateRiskOwner(studyId, values), onSuccess: invalidate }),
    bulkLopa: useMutation({ mutationFn: (values: Record<string, any>) => hazopService.bulkMarkLopaRequired(studyId, values), onSuccess: invalidate }),
    exportRegister: useMutation({ mutationFn: () => hazopService.exportRiskRegister(studyId) })
  };
}
