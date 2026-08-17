import { useQuery } from '@tanstack/react-query';
import { requiredTrainingService } from '../services/required-training.service';

export function useRequiredTrainingDetail(trainingId: string) {
  return useQuery({ queryKey: ['required-training', 'detail', trainingId], queryFn: () => requiredTrainingService.detail(trainingId), enabled: Boolean(trainingId) });
}

export function useRequiredTrainingHistory(trainingId?: string) {
  return useQuery({
    queryKey: ['required-training', 'history', trainingId],
    queryFn: () => trainingId ? requiredTrainingService.itemHistory(trainingId) : requiredTrainingService.history(),
    enabled: trainingId !== ''
  });
}
