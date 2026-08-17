import { useQuery } from '@tanstack/react-query';
import { trainingRecordsService } from '../services/training-records.service';

export function useTrainingAttendance(sessionId: string) {
  return useQuery({ queryKey: ['training-records', 'attendance', sessionId], queryFn: () => trainingRecordsService.attendance(sessionId), enabled: Boolean(sessionId) });
}
