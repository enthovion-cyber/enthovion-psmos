import { useQuery } from '@tanstack/react-query';
import { incidentRegisterService } from '../services/incident-register.service';
export function useIncidentPsmEvents() { return useQuery({ queryKey: ['incidents', 'psm'], queryFn: incidentRegisterService.psmEvents }); }
