import { useMutation, useQueryClient } from '@tanstack/react-query';
import { incidentCreateService } from '../services/incident-create.service';
import { incidentEvidenceService } from '../services/incident-evidence.service';

export function useIncidentEvidenceUpload(incidentId?: string) {
  const queryClient = useQueryClient();
  const invalidate = () => incidentId ? Promise.all([
    queryClient.invalidateQueries({ queryKey: ['incidents', 'evidence-attachments', incidentId] }),
    queryClient.invalidateQueries({ queryKey: ['incidents', 'detail', incidentId] }),
    queryClient.invalidateQueries({ queryKey: ['incidents', 'overview', incidentId] }),
    queryClient.invalidateQueries({ queryKey: ['incidents', 'dashboard'] })
  ]) : Promise.resolve();
  return {
    upload: useMutation({ mutationFn: (values: any) => incidentId ? incidentEvidenceService.create(incidentId, values) : incidentCreateService.uploadEvidence(values), onSuccess: invalidate }),
    remove: useMutation({ mutationFn: (evidenceId: string) => incidentId ? incidentEvidenceService.remove(incidentId, evidenceId) : incidentCreateService.deleteEvidence(evidenceId), onSuccess: invalidate })
  };
}
