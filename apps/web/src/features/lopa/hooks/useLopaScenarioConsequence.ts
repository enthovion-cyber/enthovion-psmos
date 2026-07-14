import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { lopaScenarioConsequenceService } from '../services/lopa-scenario-consequence.service';
import type { LopaScenarioUpdate } from '../types/lopa-scenario-consequence.types';

function useRefresh(id: string) {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: ['lopa', 'scenario-consequence', id] });
    void queryClient.invalidateQueries({ queryKey: ['lopa', 'overview', id] });
    void queryClient.invalidateQueries({ queryKey: ['lopa', 'study', id] });
  };
}

export function useLopaScenarioConsequence(id: string) {
  return {
    data: useQuery({ queryKey: ['lopa', 'scenario-consequence', id], queryFn: () => lopaScenarioConsequenceService.get(id), enabled: !!id }),
    context: useQuery({ queryKey: ['lopa', 'scenario-consequence', id, 'context'], queryFn: () => lopaScenarioConsequenceService.context(id), enabled: !!id })
  };
}

export function useLopaScenarioConsequenceMutations(id: string) {
  const refresh = useRefresh(id);
  return {
    update: useMutation({ mutationFn: (values: LopaScenarioUpdate) => lopaScenarioConsequenceService.update(id, values), onSuccess: refresh }),
    syncHazop: useMutation({ mutationFn: () => lopaScenarioConsequenceService.syncHazop(id), onSuccess: refresh }),
    markComplete: useMutation({ mutationFn: () => lopaScenarioConsequenceService.markComplete(id), onSuccess: refresh }),
    addReceptor: useMutation({ mutationFn: (values: Record<string, any>) => lopaScenarioConsequenceService.addReceptor(id, values), onSuccess: refresh }),
    updateReceptor: useMutation({ mutationFn: ({ receptorId, values }: { receptorId: string; values: Record<string, any> }) => lopaScenarioConsequenceService.updateReceptor(id, receptorId, values), onSuccess: refresh }),
    deleteReceptor: useMutation({ mutationFn: (receptorId: string) => lopaScenarioConsequenceService.deleteReceptor(id, receptorId), onSuccess: refresh }),
    addNote: useMutation({ mutationFn: (values: Record<string, any>) => lopaScenarioConsequenceService.addNote(id, values), onSuccess: refresh }),
    updateNote: useMutation({ mutationFn: ({ noteId, values }: { noteId: string; values: Record<string, any> }) => lopaScenarioConsequenceService.updateNote(id, noteId, values), onSuccess: refresh }),
    deleteNote: useMutation({ mutationFn: (noteId: string) => lopaScenarioConsequenceService.deleteNote(id, noteId), onSuccess: refresh })
  };
}
