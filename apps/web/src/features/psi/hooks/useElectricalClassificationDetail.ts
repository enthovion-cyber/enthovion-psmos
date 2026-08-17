import { useQuery } from '@tanstack/react-query';
import { electricalClassificationService } from '../services/electrical-classification.service';

export function useElectricalClassificationDetail(classificationId: string) {
  return useQuery({ queryKey: ['psi', 'electrical-classification', classificationId], queryFn: () => electricalClassificationService.detail(classificationId), enabled: Boolean(classificationId) });
}
