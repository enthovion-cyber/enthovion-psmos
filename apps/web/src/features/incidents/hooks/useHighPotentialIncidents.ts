import { useQuery } from '@tanstack/react-query';
import { incidentRegisterService } from '../services/incident-register.service';
export function useHighPotentialIncidents() { return useQuery({ queryKey: ['incidents', 'high-potential'], queryFn: incidentRegisterService.highPotential }); }
