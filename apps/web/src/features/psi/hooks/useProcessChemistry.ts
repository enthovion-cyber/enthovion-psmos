import { useQuery } from '@tanstack/react-query';
import { processChemistryService } from '../services/process-chemistry.service';

export function useProcessChemistry(filters: Record<string, unknown> = {}, unitId?: string | undefined) {
  return useQuery({ queryKey: ['psi', 'process-chemistry', unitId ?? 'global', filters], queryFn: () => unitId ? processChemistryService.unitRegistry(unitId, filters) : processChemistryService.registry(filters) });
}

export function useProcessChemistryLookups() {
  return useQuery({ queryKey: ['psi', 'process-chemistry-lookups'], queryFn: () => processChemistryService.lookups(), staleTime: 300_000 });
}
