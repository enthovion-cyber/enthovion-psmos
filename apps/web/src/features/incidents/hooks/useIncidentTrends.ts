import { useQuery } from '@tanstack/react-query';
import { incidentRegisterService } from '../services/incident-register.service';
export function useIncidentTrends() { return useQuery({ queryKey: ['incidents', 'trends'], queryFn: incidentRegisterService.trends }); }
