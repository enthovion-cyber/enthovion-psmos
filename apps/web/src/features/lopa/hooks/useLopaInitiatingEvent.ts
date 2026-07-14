import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { lopaInitiatingEventService } from '../services/lopa-initiating-event.service';
import type { LopaInitiatingEventUpdate } from '../types/lopa-initiating-event.types';

function useRefresh(id: string) {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: ['lopa', 'initiating-event', id] });
    void queryClient.invalidateQueries({ queryKey: ['lopa', 'overview', id] });
    void queryClient.invalidateQueries({ queryKey: ['lopa', 'study', id] });
  };
}

export function useLopaInitiatingEvent(id: string) {
  return {
    data: useQuery({ queryKey: ['lopa', 'initiating-event', id], queryFn: () => lopaInitiatingEventService.get(id), enabled: !!id }),
    context: useQuery({ queryKey: ['lopa', 'initiating-event', id, 'context'], queryFn: () => lopaInitiatingEventService.context(id), enabled: !!id })
  };
}

export function useLopaInitiatingEventMutations(id: string) {
  const refresh = useRefresh(id);
  return {
    update: useMutation({ mutationFn: (values: LopaInitiatingEventUpdate) => lopaInitiatingEventService.update(id, values), onSuccess: refresh }),
    saveManualFrequency: useMutation({ mutationFn: (values: Record<string, any>) => lopaInitiatingEventService.saveManualFrequency(id, values), onSuccess: refresh }),
    saveSiteModifier: useMutation({ mutationFn: (values: Record<string, any>) => lopaInitiatingEventService.saveSiteModifier(id, values), onSuccess: refresh }),
    markComplete: useMutation({ mutationFn: () => lopaInitiatingEventService.markComplete(id), onSuccess: refresh }),
    updateModifier: useMutation({ mutationFn: ({ snapshotId, values }: { snapshotId: string; values: Record<string, any> }) => lopaInitiatingEventService.updateModifier(id, snapshotId, values), onSuccess: refresh }),
    archiveModifier: useMutation({ mutationFn: (snapshotId: string) => lopaInitiatingEventService.archiveModifier(id, snapshotId), onSuccess: refresh }),
    addNote: useMutation({ mutationFn: (values: Record<string, any>) => lopaInitiatingEventService.addNote(id, values), onSuccess: refresh }),
    updateNote: useMutation({ mutationFn: ({ noteId, values }: { noteId: string; values: Record<string, any> }) => lopaInitiatingEventService.updateNote(id, noteId, values), onSuccess: refresh }),
    deleteNote: useMutation({ mutationFn: (noteId: string) => lopaInitiatingEventService.deleteNote(id, noteId), onSuccess: refresh })
  };
}
