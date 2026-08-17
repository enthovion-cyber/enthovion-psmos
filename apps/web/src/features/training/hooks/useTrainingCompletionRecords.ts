import { useQuery } from '@tanstack/react-query';
import { trainingRecordsService } from '../services/training-records.service';

export function useTrainingCompletionRecords(params: Record<string, unknown> = {}) {
  return useQuery({ queryKey: ['training-records', 'completion-records', params], queryFn: () => trainingRecordsService.records(params) });
}

export function useTrainingCompletionRecord(recordId: string) {
  return useQuery({ queryKey: ['training-records', 'completion-record', recordId], queryFn: () => trainingRecordsService.recordDetail(recordId), enabled: Boolean(recordId) });
}
