import { useQuery } from '@tanstack/react-query';
import { competencyGapService } from '../services/competency-gap.service';

export function useCompetencyGaps(params?: Record<string, unknown>) {
  return useQuery({ queryKey: ['competency-gaps', params], queryFn: () => competencyGapService.list(params) });
}
