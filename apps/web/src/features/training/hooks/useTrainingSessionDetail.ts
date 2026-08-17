import { useQuery } from '@tanstack/react-query';
import { trainingRecordsService } from '../services/training-records.service';

export function useTrainingSessionDetail(sessionId: string) {
  return useQuery({ queryKey: ['training-records', 'session', sessionId], queryFn: () => trainingRecordsService.sessionDetail(sessionId), enabled: Boolean(sessionId) });
}
