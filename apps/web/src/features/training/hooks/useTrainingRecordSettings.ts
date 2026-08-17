import { useQuery } from '@tanstack/react-query';
import { trainingRecordsService } from '../services/training-records.service';

export function useTrainingRecordSettings(params: Record<string, unknown> = {}) {
  return useQuery({ queryKey: ['training-records', 'settings', params], queryFn: () => trainingRecordsService.settings(params) });
}
