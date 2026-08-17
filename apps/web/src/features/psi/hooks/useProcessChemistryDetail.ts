import { useQuery } from '@tanstack/react-query';
import { processChemistryService } from '../services/process-chemistry.service';

export function useProcessChemistryDetail(chemistryId: string) {
  return useQuery({ queryKey: ['psi', 'process-chemistry-detail', chemistryId], queryFn: () => processChemistryService.detail(chemistryId), enabled: Boolean(chemistryId) });
}
