import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { lopaLibraryService } from '../services/lopa-library.service';
import type { LibraryFilters } from '../types/lopa-library.types';

export function useLopaLibraryContext() {
  return useQuery({ queryKey: ['lopa', 'libraries', 'context'], queryFn: lopaLibraryService.context });
}

export function useInitiatingEventLibrary(filters: LibraryFilters) {
  return {
    summary: useQuery({ queryKey: ['lopa', 'libraries', 'initiating-events', 'summary'], queryFn: lopaLibraryService.initiatingSummary }),
    register: useQuery({ queryKey: ['lopa', 'libraries', 'initiating-events', filters], queryFn: () => lopaLibraryService.initiatingList(filters) })
  };
}

export function useConditionalModifierLibrary(filters: LibraryFilters) {
  return {
    summary: useQuery({ queryKey: ['lopa', 'libraries', 'conditional-modifiers', 'summary'], queryFn: lopaLibraryService.modifierSummary }),
    register: useQuery({ queryKey: ['lopa', 'libraries', 'conditional-modifiers', filters], queryFn: () => lopaLibraryService.modifierList(filters) })
  };
}

export function useLopaLibraryMutations(kind: 'initiating' | 'modifier') {
  const queryClient = useQueryClient();
  const root = kind === 'initiating' ? ['lopa', 'libraries', 'initiating-events'] : ['lopa', 'libraries', 'conditional-modifiers'];
  const refresh = () => void queryClient.invalidateQueries({ queryKey: root });
  return {
    create: useMutation<any, Error, Record<string, any>>({ mutationFn: (values) => kind === 'initiating' ? lopaLibraryService.initiatingCreate(values) : lopaLibraryService.modifierCreate(values), onSuccess: refresh }),
    update: useMutation<any, Error, { id: string; values: Record<string, any> }>({ mutationFn: ({ id, values }) => kind === 'initiating' ? lopaLibraryService.initiatingUpdate(id, values) : lopaLibraryService.modifierUpdate(id, values), onSuccess: refresh }),
    action: useMutation<any, Error, { id: string; action: any; reason?: string }>({ mutationFn: ({ id, action, reason }) => kind === 'initiating' ? lopaLibraryService.initiatingAction(id, action, reason) : lopaLibraryService.modifierAction(id, action, reason), onSuccess: refresh })
  };
}
