import { useMutation, useQueryClient } from '@tanstack/react-query';
import { pssrService } from '../services/pssr.service';

export function usePSSRMutations(id: string) {
  const queryClient = useQueryClient();
  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['pssr', id] });
    queryClient.invalidateQueries({ queryKey: ['moc'] });
  };
  return {
    readinessCheck: useMutation({ mutationFn: () => pssrService.readinessCheck(id), onSuccess: invalidate }),
    generateChecklist: useMutation({ mutationFn: () => pssrService.generateChecklist(id), onSuccess: invalidate }),
    syncLinkedMoc: useMutation({ mutationFn: () => pssrService.syncLinkedMoc(id), onSuccess: invalidate }),
    transition: useMutation({ mutationFn: (action: string) => pssrService.transition(id, action), onSuccess: invalidate }),
    addEquipment: useMutation({ mutationFn: (values: { equipmentId: string; isPrimary?: boolean }) => pssrService.addEquipment(id, values), onSuccess: invalidate }),
    removeEquipment: useMutation({ mutationFn: (equipmentId: string) => pssrService.removeEquipment(id, equipmentId), onSuccess: invalidate }),
    update: useMutation({ mutationFn: (values: Record<string, any>) => pssrService.update(id, values), onSuccess: invalidate })
  };
}
