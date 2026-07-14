import { useMutation } from '@tanstack/react-query';
import { incidentCreateService } from '../services/incident-create.service';

export function useIncidentFollowupRecommendations() {
  return useMutation({ mutationFn: incidentCreateService.recommendFollowups });
}
