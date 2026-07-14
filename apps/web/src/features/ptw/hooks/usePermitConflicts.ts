import { useQuery } from '@tanstack/react-query';
import { ptwConflictService } from '../services/ptw-conflict.service';

export function usePermitConflicts(permitId: string) {
  return useQuery({ queryKey: ['ptw', permitId, 'conflicts'], queryFn: () => ptwConflictService.list(permitId) });
}
export function usePermitConflictSummary(permitId: string) {
  return useQuery({ queryKey: ['ptw', permitId, 'conflicts', 'summary'], queryFn: () => ptwConflictService.summary(permitId) });
}
export function usePermitSimops(permitId: string) {
  return useQuery({ queryKey: ['ptw', permitId, 'simops'], queryFn: () => ptwConflictService.simops(permitId) });
}
export function usePermitConflictMatrix() {
  return useQuery({ queryKey: ['ptw', 'conflict-matrix'], queryFn: () => ptwConflictService.matrix() });
}
export function usePermitConflictMap(permitId: string) {
  return useQuery({ queryKey: ['ptw', permitId, 'conflicts', 'map'], queryFn: () => ptwConflictService.map(permitId) });
}
export function usePermitConflictHistory(permitId: string) {
  return useQuery({ queryKey: ['ptw', permitId, 'conflicts', 'history'], queryFn: () => ptwConflictService.history(permitId) });
}
