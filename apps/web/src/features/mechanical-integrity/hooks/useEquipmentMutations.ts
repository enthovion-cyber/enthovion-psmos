'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { CreateEquipmentInput } from '@/services/equipment.service';
import { miEquipmentService } from '../services/equipment.service';

export function useEquipmentMutations(id?: string) {
  const queryClient = useQueryClient();
  const invalidate = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['mechanical-integrity'] }),
      queryClient.invalidateQueries({ queryKey: ['equipment'] })
    ]);
  };
  return {
    create: useMutation({ mutationFn: (input: CreateEquipmentInput) => miEquipmentService.create(input), onSuccess: invalidate }),
    update: useMutation({ mutationFn: (input: Partial<CreateEquipmentInput>) => miEquipmentService.update(id ?? '', input), onSuccess: invalidate }),
    changeStatus: useMutation({ mutationFn: (input: { status: string; reason: string }) => miEquipmentService.changeStatus(id ?? '', input), onSuccess: invalidate }),
    archive: useMutation({ mutationFn: (reason: string) => miEquipmentService.archive(id ?? '', reason), onSuccess: invalidate }),
    reactivate: useMutation({ mutationFn: (reason: string) => miEquipmentService.reactivate(id ?? '', reason), onSuccess: invalidate }),
    addLinkedRecord: useMutation({ mutationFn: (input: Record<string, unknown>) => miEquipmentService.addLinkedRecord(id ?? '', input), onSuccess: invalidate }),
    removeLinkedRecord: useMutation({ mutationFn: (input: { linkId: string; reason?: string }) => miEquipmentService.removeLinkedRecord(id ?? '', input.linkId, input.reason), onSuccess: invalidate }),
    addDocument: useMutation({ mutationFn: (input: { title: string; documentType: string; documentNo?: string; file?: File }) => miEquipmentService.addDocument(id ?? '', input), onSuccess: invalidate }),
    removeDocument: useMutation({ mutationFn: (documentLinkId: string) => miEquipmentService.removeDocument(id ?? '', documentLinkId), onSuccess: invalidate })
  };
}
