import { useQuery } from '@tanstack/react-query';
import { incidentCreateService } from '../services/incident-create.service';

export function useIncidentCreateContext() {
  return useQuery({ queryKey: ['incidents', 'create-context'], queryFn: incidentCreateService.context, refetchOnWindowFocus: false });
}
