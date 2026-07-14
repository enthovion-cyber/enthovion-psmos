import { useMutation } from '@tanstack/react-query';
import { incidentCreateService } from '../services/incident-create.service';

export { useIncidentPotentialSeverity as useIncidentRiskMatrix } from './useIncidentPotentialSeverity';

export function useIncidentRiskCalculation() {
  return useMutation({ mutationFn: incidentCreateService.calculateRisk });
}
