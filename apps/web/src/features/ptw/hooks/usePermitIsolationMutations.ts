import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ptwIsolationService } from '../services/ptw-isolation.service';
import type { IsolationPointValues } from '../schemas/isolation.schema';

export function usePermitIsolationMutations(permitId: string) {
  const queryClient = useQueryClient();
  const invalidate = () => Promise.all([
    queryClient.invalidateQueries({ queryKey: ['ptw'] }),
    queryClient.invalidateQueries({ queryKey: ['ptw', permitId] }),
    queryClient.invalidateQueries({ queryKey: ['ptw', permitId, 'isolation'] }),
    queryClient.invalidateQueries({ queryKey: ['ptw', permitId, 'history'] })
  ]);

  return {
    create: useMutation({ mutationFn: (input: IsolationPointValues) => ptwIsolationService.create(permitId, input), onSuccess: invalidate }),
    update: useMutation({ mutationFn: ({ id, input }: { id: string; input: Partial<IsolationPointValues> }) => ptwIsolationService.update(permitId, id, input), onSuccess: invalidate }),
    remove: useMutation({ mutationFn: (id: string) => ptwIsolationService.remove(permitId, id), onSuccess: invalidate }),
    importFromEquipment: useMutation({ mutationFn: () => ptwIsolationService.importFromEquipment(permitId), onSuccess: invalidate }),
    confirm: useMutation({ mutationFn: (id: string) => ptwIsolationService.confirm(permitId, id, `Confirmed ${new Date().toISOString()}`), onSuccess: invalidate }),
    verify: useMutation({ mutationFn: (id: string) => ptwIsolationService.verify(permitId, id), onSuccess: invalidate }),
    startDeIsolation: useMutation({ mutationFn: () => ptwIsolationService.startDeIsolation(permitId), onSuccess: invalidate }),
    deIsolate: useMutation({ mutationFn: (id: string) => ptwIsolationService.deIsolate(permitId, id, `De-isolated ${new Date().toISOString()}`), onSuccess: invalidate }),
    removalVerify: useMutation({ mutationFn: (id: string) => ptwIsolationService.removalVerify(permitId, id, `Removal verified ${new Date().toISOString()}`), onSuccess: invalidate }),
    generateCertificate: useMutation({ mutationFn: () => ptwIsolationService.generateCertificate(permitId), onSuccess: invalidate })
  };
}
