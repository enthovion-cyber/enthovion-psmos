'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { miCmlService } from '../services/cml.service';

export function useCmlMutations(equipmentId: string, cmlId?: string) {
  const qc = useQueryClient();
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['mechanical-integrity', 'equipment', equipmentId, 'cmls'] });
    qc.invalidateQueries({ queryKey: ['mechanical-integrity', 'equipment', equipmentId, 'cml', cmlId] });
  };
  return {
    create: useMutation({ mutationFn: (input: Record<string, unknown>) => miCmlService.create(equipmentId, input), onSuccess: invalidate }),
    update: useMutation({ mutationFn: (input: Record<string, unknown>) => miCmlService.update(equipmentId, cmlId!, input), onSuccess: invalidate }),
    addReading: useMutation({ mutationFn: (input: Record<string, unknown>) => miCmlService.addReading(equipmentId, cmlId!, input), onSuccess: invalidate }),
    approveReading: useMutation({ mutationFn: (input: { readingId: string; comment?: string }) => miCmlService.approveReading(equipmentId, cmlId!, input.readingId, input.comment), onSuccess: invalidate }),
    recalculate: useMutation({ mutationFn: () => miCmlService.recalculate(equipmentId, cmlId!), onSuccess: invalidate }),
    recalculateAll: useMutation({ mutationFn: () => miCmlService.recalculateAll(equipmentId), onSuccess: invalidate }),
    importRows: useMutation({ mutationFn: (rows: Array<Record<string, unknown>>) => miCmlService.importRows(equipmentId, rows), onSuccess: invalidate })
  };
}
