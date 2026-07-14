import { useMutation, useQueryClient } from '@tanstack/react-query';
import { incidentCreateService } from '../services/incident-create.service';

export function useIncidentSubmit() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: incidentCreateService.submit, onSuccess: () => qc.invalidateQueries({ queryKey: ['incidents'] }) });
}
