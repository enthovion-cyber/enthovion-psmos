import { useQuery } from '@tanstack/react-query';
import { competencyProfileService } from '../services/competency-profile.service';

export function useCompetencyDashboard(params?: Record<string, unknown>) {
  return useQuery({ queryKey: ['competency-dashboard', params], queryFn: () => competencyProfileService.dashboard(params) });
}
