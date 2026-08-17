import { useQuery } from '@tanstack/react-query';
import { trainingRecordsService } from '../services/training-records.service';

export function useTrainingRecordsDashboard(params: Record<string, unknown> = {}) {
  return useQuery({ queryKey: ['training-records', 'dashboard', params], queryFn: () => trainingRecordsService.dashboard(params) });
}
