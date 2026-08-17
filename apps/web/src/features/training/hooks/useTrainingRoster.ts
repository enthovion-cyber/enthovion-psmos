import { useQuery } from '@tanstack/react-query';
import { trainingRecordsService } from '../services/training-records.service';

export function useTrainingRoster(sessionId: string) {
  return useQuery({ queryKey: ['training-records', 'roster', sessionId], queryFn: () => trainingRecordsService.roster(sessionId), enabled: Boolean(sessionId) });
}
