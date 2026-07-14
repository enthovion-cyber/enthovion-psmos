import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { incidentCreateService } from '../services/incident-create.service';

export function useIncidentDraft(draftId?: string) {
  return useQuery({ queryKey: ['incidents', 'draft', draftId], queryFn: () => incidentCreateService.getDraft(draftId!), enabled: !!draftId });
}

export function useIncidentDraftMutations() {
  const qc = useQueryClient();
  const refresh = () => qc.invalidateQueries({ queryKey: ['incidents', 'create-context'] });
  return {
    create: useMutation({ mutationFn: incidentCreateService.createDraft, onSuccess: refresh }),
    update: useMutation({ mutationFn: ({ id, values }: { id: string; values: any }) => incidentCreateService.updateDraft(id, values), onSuccess: refresh }),
    remove: useMutation({ mutationFn: incidentCreateService.deleteDraft, onSuccess: refresh }),
    submit: useMutation({ mutationFn: incidentCreateService.submitDraft, onSuccess: refresh })
  };
}
