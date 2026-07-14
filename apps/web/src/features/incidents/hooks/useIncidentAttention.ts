import { useQuery } from '@tanstack/react-query';
import { incidentRegisterService } from '../services/incident-register.service';
export function useIncidentAttention() { return useQuery({ queryKey: ['incidents', 'attention'], queryFn: incidentRegisterService.attention }); }
