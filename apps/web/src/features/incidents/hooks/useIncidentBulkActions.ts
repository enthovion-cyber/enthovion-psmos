import { useMutation, useQueryClient } from '@tanstack/react-query';
import { incidentRegisterService } from '../services/incident-register.service';
export function useIncidentBulkActions() {
  const qc = useQueryClient();
  const done = () => void qc.invalidateQueries({ queryKey: ['incidents'] });
  return { update: useMutation({ mutationFn: incidentRegisterService.bulkUpdate, onSuccess: done }), assign: useMutation({ mutationFn: incidentRegisterService.bulkAssign, onSuccess: done }), createAction: useMutation({ mutationFn: incidentRegisterService.bulkCreateAction, onSuccess: done }) };
}
