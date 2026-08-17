import { useQuery } from '@tanstack/react-query';
import { competencyEvaluationService } from '../services/competency-evaluation.service';

export function useWorkerCompetencyProfile(workerId: string) {
  return useQuery({ queryKey: ['worker-competency-profile', workerId], queryFn: () => competencyEvaluationService.worker(workerId), enabled: Boolean(workerId) });
}
