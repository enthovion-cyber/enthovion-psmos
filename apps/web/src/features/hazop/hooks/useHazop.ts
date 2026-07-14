'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { hazopService } from '../services/hazop.service';

export function useHazopDashboard() {
  return useQuery({ queryKey: ['hazop', 'dashboard'], queryFn: hazopService.dashboard });
}

export function useHazopStudies(params?: Record<string, any>) {
  return useQuery({ queryKey: ['hazop', 'studies', params], queryFn: () => hazopService.list(params) });
}

export function useHazopContext() {
  return useQuery({ queryKey: ['hazop', 'context'], queryFn: hazopService.context });
}

export function useHazopStudy(id: string) {
  return useQuery({ queryKey: ['hazop', id], queryFn: () => hazopService.get(id), enabled: Boolean(id) });
}

export function useHazopMutations(id?: string) {
  const queryClient = useQueryClient();
  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ['hazop'] });
    if (id) void queryClient.invalidateQueries({ queryKey: ['hazop', id] });
  };
  return {
    create: useMutation({ mutationFn: hazopService.create, onSuccess: invalidate }),
    update: useMutation({ mutationFn: (values: Record<string, any>) => hazopService.update(id!, values), onSuccess: invalidate }),
    transition: useMutation({ mutationFn: ({ action, body }: { action: string; body?: Record<string, any> }) => hazopService.transition(id!, action, body), onSuccess: invalidate }),
    addNode: useMutation({ mutationFn: (values: Record<string, any>) => hazopService.addNode(id!, values), onSuccess: invalidate }),
    addScenario: useMutation({ mutationFn: (values: Record<string, any>) => hazopService.addScenario(id!, values), onSuccess: invalidate }),
    addRecommendation: useMutation({ mutationFn: (values: Record<string, any>) => hazopService.addRecommendation(id!, values), onSuccess: invalidate }),
    createAction: useMutation({ mutationFn: (recommendationId: string) => hazopService.createAction(id!, recommendationId), onSuccess: invalidate })
  };
}
