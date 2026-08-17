import { useQuery } from '@tanstack/react-query';
import { psiChemicalService } from '../services/psi-chemical.service';

export function usePsiChemicalDetail(chemicalId: string) {
  return useQuery({ queryKey: ['psi', 'chemicals', chemicalId], queryFn: () => psiChemicalService.detail(chemicalId), enabled: Boolean(chemicalId) });
}
