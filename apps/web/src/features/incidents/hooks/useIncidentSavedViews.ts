import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { incidentRegisterService } from '../services/incident-register.service';
export function useIncidentSavedViews() {
  const qc = useQueryClient();
  const done = () => void qc.invalidateQueries({ queryKey: ['incidents'] });
  return { query: useQuery({ queryKey: ['incidents', 'saved-views'], queryFn: incidentRegisterService.savedViews }), save: useMutation({ mutationFn: incidentRegisterService.saveView, onSuccess: done }), remove: useMutation({ mutationFn: (id: string) => incidentRegisterService.deleteView(id), onSuccess: done }) };
}
