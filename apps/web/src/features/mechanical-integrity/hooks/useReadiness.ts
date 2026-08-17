import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { readinessService } from '../services/readiness.service';

export function useReadiness(filters: Record<string, unknown> = {}) {
  return useQuery({ queryKey: ['mechanical-integrity', 'readiness', filters], queryFn: () => readinessService.registry(filters) });
}

export function useReadinessLookups() {
  return useQuery({ queryKey: ['mechanical-integrity', 'readiness', 'lookups'], queryFn: () => readinessService.lookups() });
}

export function useEquipmentReadiness(equipmentId?: string) {
  return useQuery({ queryKey: ['mechanical-integrity', 'equipment-readiness', equipmentId], queryFn: () => readinessService.equipment(equipmentId as string), enabled: Boolean(equipmentId) });
}

export function useEquipmentReadinessMutations(equipmentId: string) {
  const queryClient = useQueryClient();
  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ['mechanical-integrity', 'equipment-readiness', equipmentId] });
    void queryClient.invalidateQueries({ queryKey: ['mechanical-integrity', 'readiness'] });
  };
  return {
    runCheck: useMutation({ mutationFn: () => readinessService.runEquipmentCheck(equipmentId), onSuccess: invalidate }),
    create: useMutation({ mutationFn: (input: Record<string, unknown>) => readinessService.createForEquipment(equipmentId, input), onSuccess: invalidate })
  };
}
