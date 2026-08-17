import { usePsiChemicalDetail } from './usePsiChemicalDetail';

export function useChemicalCompatibility(chemicalId: string) {
  return usePsiChemicalDetail(chemicalId);
}
