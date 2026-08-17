'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { miEquipmentService } from '../services/equipment.service';

export function useTechnicalDataMutations(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Record<string, unknown>) => miEquipmentService.updateTechnicalData(id, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['mechanical-integrity', 'equipment', id, 'technical-data'] });
      qc.invalidateQueries({ queryKey: ['mechanical-integrity', 'equipment', id, 'technical-data', 'revisions'] });
    }
  });
}
