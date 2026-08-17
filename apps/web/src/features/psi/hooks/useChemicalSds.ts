import { usePsiChemicalDetail } from './usePsiChemicalDetail';

export function useChemicalSds(chemicalId: string) {
  return usePsiChemicalDetail(chemicalId);
}
