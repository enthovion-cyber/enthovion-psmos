'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { hazopService } from '../services/hazop.service';

export function useHazopNodesContext(studyId: string) {
  return useQuery({ queryKey: ['hazop', studyId, 'nodes-context'], queryFn: () => hazopService.nodesContext(studyId), enabled: Boolean(studyId) });
}

export function useHazopNodeMutations(studyId: string) {
  const queryClient = useQueryClient();
  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ['hazop'] });
    void queryClient.invalidateQueries({ queryKey: ['hazop', studyId] });
    void queryClient.invalidateQueries({ queryKey: ['hazop', studyId, 'nodes-context'] });
  };
  return {
    addNode: useMutation({ mutationFn: (values: Record<string, any>) => hazopService.addNode(studyId, values), onSuccess: invalidate }),
    updateNode: useMutation({ mutationFn: ({ nodeId, values }: { nodeId: string; values: Record<string, any> }) => hazopService.updateNode(studyId, nodeId, values), onSuccess: invalidate }),
    deleteNode: useMutation({ mutationFn: (nodeId: string) => hazopService.deleteNode(studyId, nodeId), onSuccess: invalidate }),
    duplicateNode: useMutation({ mutationFn: (nodeId: string) => hazopService.duplicateNode(studyId, nodeId), onSuccess: invalidate }),
    reorderNodes: useMutation({ mutationFn: (nodeIds: string[]) => hazopService.reorderNodes(studyId, nodeIds), onSuccess: invalidate }),
    markNodeComplete: useMutation({ mutationFn: (nodeId: string) => hazopService.markNodeComplete(studyId, nodeId), onSuccess: invalidate }),
    reopenNode: useMutation({ mutationFn: (nodeId: string) => hazopService.reopenNode(studyId, nodeId), onSuccess: invalidate }),
    createCustomParameter: useMutation({ mutationFn: (values: Record<string, any>) => hazopService.createCustomNodeParameter(studyId, values), onSuccess: invalidate })
  };
}

export function useHazopScenarioMutations(studyId: string) {
  const queryClient = useQueryClient();
  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ['hazop'] });
    void queryClient.invalidateQueries({ queryKey: ['hazop', studyId] });
  };
  return {
    addScenario: useMutation({ mutationFn: (values: Record<string, any>) => hazopService.addScenarioToNode(studyId, values.nodeId, values), onSuccess: invalidate }),
    updateScenario: useMutation({ mutationFn: ({ scenarioId, values }: { scenarioId: string; values: Record<string, any> }) => hazopService.updateScenario(studyId, scenarioId, values), onSuccess: invalidate }),
    deleteScenario: useMutation({ mutationFn: (scenarioId: string) => hazopService.deleteScenario(studyId, scenarioId), onSuccess: invalidate }),
    duplicateScenario: useMutation({ mutationFn: (scenarioId: string) => hazopService.duplicateScenario(studyId, scenarioId), onSuccess: invalidate }),
    bulkGenerate: useMutation({ mutationFn: (values: Record<string, any>) => hazopService.bulkGenerateScenarios(studyId, values), onSuccess: invalidate }),
    markLopaRequired: useMutation({ mutationFn: ({ scenarioId, reason }: { scenarioId: string; reason: string }) => hazopService.markScenarioLopaRequired(studyId, scenarioId, reason), onSuccess: invalidate }),
    closeScenario: useMutation({ mutationFn: (scenarioId: string) => hazopService.closeScenario(studyId, scenarioId), onSuccess: invalidate }),
    addSafeguard: useMutation({ mutationFn: ({ scenarioId, values }: { scenarioId: string; values: Record<string, any> }) => hazopService.addSafeguard(studyId, scenarioId, values), onSuccess: invalidate }),
    addRecommendation: useMutation({ mutationFn: (values: Record<string, any>) => hazopService.addRecommendation(studyId, values), onSuccess: invalidate })
  };
}
