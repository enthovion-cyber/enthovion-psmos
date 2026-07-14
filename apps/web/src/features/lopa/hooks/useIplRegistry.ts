import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { lopaIplRegistryService } from '../services/lopa-ipl-registry.service';
import type { IplRegistryFilters, IplRegistryValidationItem } from '../types/lopa-ipl-registry.types';

const root = ['lopa', 'ipl-registry'];

export function useIplRegistry(filters: IplRegistryFilters) {
  return {
    context: useQuery({ queryKey: [...root, 'context'], queryFn: lopaIplRegistryService.context }),
    summary: useQuery({ queryKey: [...root, 'summary'], queryFn: lopaIplRegistryService.summary }),
    register: useQuery({ queryKey: [...root, 'list', filters], queryFn: () => lopaIplRegistryService.list(filters) })
  };
}

export function useIplRegistryMutations() {
  const queryClient = useQueryClient();
  const refresh = () => void queryClient.invalidateQueries({ queryKey: root });
  return {
    create: useMutation<any, Error, Record<string, any>>({ mutationFn: lopaIplRegistryService.create, onSuccess: refresh }),
    update: useMutation<any, Error, { id: string; values: Record<string, any> }>({ mutationFn: ({ id, values }) => lopaIplRegistryService.update(id, values), onSuccess: refresh }),
    action: useMutation<any, Error, { id: string; action: 'submit-review' | 'approve' | 'reject' | 'create-revision' | 'archive' | 'restore' | 'duplicate'; reason?: string }>({ mutationFn: ({ id, action, reason }) => lopaIplRegistryService.action(id, action, reason), onSuccess: refresh }),
    validation: useMutation<any, Error, { id: string; items: IplRegistryValidationItem[] }>({ mutationFn: ({ id, items }) => lopaIplRegistryService.updateValidation(id, items), onSuccess: refresh }),
    equipmentLink: useMutation<any, Error, { id: string; values: Record<string, any> }>({ mutationFn: ({ id, values }) => lopaIplRegistryService.addEquipmentLink(id, values), onSuccess: refresh }),
    documentLink: useMutation<any, Error, { id: string; values: Record<string, any> }>({ mutationFn: ({ id, values }) => lopaIplRegistryService.addDocumentLink(id, values), onSuccess: refresh })
  };
}
