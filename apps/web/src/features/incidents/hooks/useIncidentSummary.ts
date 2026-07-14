import { useQuery } from '@tanstack/react-query';
import { incidentRegisterService } from '../services/incident-register.service';
export function useIncidentSummary() { return useQuery({ queryKey: ['incidents', 'summary'], queryFn: incidentRegisterService.summary }); }
