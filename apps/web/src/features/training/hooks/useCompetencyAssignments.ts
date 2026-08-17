import { useQuery } from '@tanstack/react-query';
import { competencyAssignmentService } from '../services/competency-assignment.service';

export function useCompetencyAssignments(params?: Record<string, unknown>) {
  return useQuery({ queryKey: ['competency-assignments', params], queryFn: () => competencyAssignmentService.list(params) });
}
