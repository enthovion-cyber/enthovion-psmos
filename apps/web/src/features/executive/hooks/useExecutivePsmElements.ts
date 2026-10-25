'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { executivePsmElementApi } from '../services/executive-psm-element.service';

const key = ['executive', 'psm-elements'] as const;

export function useExecutivePsmDashboard() {
  return useQuery({ queryKey: [...key, 'dashboard'], queryFn: () => executivePsmElementApi.dashboard(), refetchOnWindowFocus: false });
}

export function useExecutivePsmElements(params: Record<string, unknown> = {}) {
  return useQuery({ queryKey: [...key, 'register', params], queryFn: () => executivePsmElementApi.elements(params), refetchOnWindowFocus: false });
}

export function useExecutivePsmElement(id: string) {
  return useQuery({ queryKey: [...key, 'detail', id], queryFn: () => executivePsmElementApi.detail(id), enabled: Boolean(id) });
}

export function useExecutivePsmMutation() {
  const client = useQueryClient();
  const refresh = () => void client.invalidateQueries({ queryKey: key });
  return {
    create: useMutation({ mutationFn: executivePsmElementApi.create, onSuccess: refresh }),
    update: useMutation({ mutationFn: ({ id, input }: { id: string; input: Record<string, unknown> }) => executivePsmElementApi.update(id, input), onSuccess: refresh }),
    archive: useMutation({ mutationFn: ({ id, reason }: { id: string; reason: string }) => executivePsmElementApi.archive(id, { reason }), onSuccess: refresh }),
    recalculate: useMutation({ mutationFn: ({ id, scope }: { id: string; scope?: Record<string, unknown> }) => executivePsmElementApi.recalculate(id, scope), onSuccess: refresh }),
    createSnapshot: useMutation({ mutationFn: executivePsmElementApi.createSnapshot, onSuccess: refresh })
  };
}
