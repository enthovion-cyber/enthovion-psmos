import { useQuery } from '@tanstack/react-query';
import { psiChemicalService } from '../services/psi-chemical.service';

export function usePsiChemicals(filters: Record<string, unknown> = {}, unitId?: string) {
  return useQuery({ queryKey: ['psi', 'chemicals', unitId ?? 'global', filters], queryFn: () => unitId ? psiChemicalService.unitChemicals(unitId, filters) : psiChemicalService.registry(filters) });
}

export function usePsiChemicalLookups() {
  return useQuery({ queryKey: ['psi', 'chemical-lookups'], queryFn: () => psiChemicalService.lookups(), staleTime: 300_000 });
}
