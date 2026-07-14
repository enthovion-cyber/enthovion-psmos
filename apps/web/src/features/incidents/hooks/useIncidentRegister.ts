import { useQuery } from '@tanstack/react-query';
import { incidentRegisterService } from '../services/incident-register.service';
import type { IncidentFilters } from '../types/incident.types';
export function useIncidentRegister(filters: IncidentFilters = {}) {
  return useQuery({ queryKey: ['incidents', 'dashboard', filters], queryFn: () => incidentRegisterService.dashboard(filters), refetchInterval: 30000, refetchOnWindowFocus: false });
}
