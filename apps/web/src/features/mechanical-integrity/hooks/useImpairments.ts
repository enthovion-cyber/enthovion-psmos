import { useQuery } from '@tanstack/react-query';
import { impairmentService } from '../services/impairment.service';

export function useImpairments(filters: Record<string, unknown> = {}) {
  return useQuery({ queryKey: ['mechanical-integrity', 'impairments', filters], queryFn: () => impairmentService.registry(filters) });
}

export function useImpairmentLookups() {
  return useQuery({ queryKey: ['mechanical-integrity', 'impairments', 'lookups'], queryFn: () => impairmentService.lookups() });
}
