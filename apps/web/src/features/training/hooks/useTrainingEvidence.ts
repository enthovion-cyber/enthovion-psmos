import { useQuery } from '@tanstack/react-query';
import { trainingRecordsService } from '../services/training-records.service';

export function useTrainingEvidence(recordId: string) {
  return useQuery({ queryKey: ['training-records', 'evidence', recordId], queryFn: () => trainingRecordsService.evidence(recordId), enabled: Boolean(recordId) });
}
