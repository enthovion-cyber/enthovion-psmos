import { useMutation } from '@tanstack/react-query';
import { incidentCreateService } from '../services/incident-create.service';

export function useIncidentPsmPseClassification() {
  return useMutation({ mutationFn: incidentCreateService.classifyPsmPse });
}
