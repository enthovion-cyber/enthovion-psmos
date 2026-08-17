import { useQuery } from '@tanstack/react-query';
import { trainingRecordsService } from '../services/training-records.service';

export function useTrainingSessions(params: Record<string, unknown> = {}) {
  return useQuery({ queryKey: ['training-records', 'sessions', params], queryFn: () => trainingRecordsService.sessions(params) });
}
