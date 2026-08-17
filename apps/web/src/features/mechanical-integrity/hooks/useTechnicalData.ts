'use client';

import { useQuery } from '@tanstack/react-query';
import { miEquipmentService } from '../services/equipment.service';

export function useTechnicalData(id: string) {
  return useQuery({ queryKey: ['mechanical-integrity', 'equipment', id, 'technical-data'], queryFn: () => miEquipmentService.technicalData(id) });
}
