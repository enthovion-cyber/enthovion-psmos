import { useQuery } from '@tanstack/react-query';
import { ptwHandoverService } from '../services/ptw-handover.service';

export function usePermitHandover(permitId: string) {
  return useQuery({ queryKey: ['ptw', permitId, 'handover'], queryFn: () => ptwHandoverService.current(permitId) });
}

export function usePermitHandoverHistory(permitId: string) {
  return useQuery({ queryKey: ['ptw', permitId, 'handover', 'history'], queryFn: () => ptwHandoverService.history(permitId) });
}

export function usePermitHandoverReadiness(permitId: string) {
  return useQuery({ queryKey: ['ptw', permitId, 'handover', 'readiness'], queryFn: () => ptwHandoverService.readiness(permitId) });
}
