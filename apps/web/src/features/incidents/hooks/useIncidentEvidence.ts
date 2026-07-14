import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { incidentEvidenceService } from '../services/incident-evidence.service';

export function useIncidentEvidence(id: string) {
  return useQuery({ queryKey: ['incidents', 'evidence-attachments', id], queryFn: () => incidentEvidenceService.tab(id), enabled: !!id, refetchOnWindowFocus: false });
}

export function useIncidentEvidenceMutations(id: string) {
  const queryClient = useQueryClient();
  const invalidate = () => Promise.all([
    queryClient.invalidateQueries({ queryKey: ['incidents', 'evidence-attachments', id] }),
    queryClient.invalidateQueries({ queryKey: ['incidents', 'detail', id] }),
    queryClient.invalidateQueries({ queryKey: ['incidents', 'overview', id] }),
    queryClient.invalidateQueries({ queryKey: ['incidents', 'dashboard'] })
  ]);
  return {
    create: useMutation({ mutationFn: (values: any) => incidentEvidenceService.create(id, values), onSuccess: invalidate }),
    update: useMutation({ mutationFn: ({ evidenceId, values }: any) => incidentEvidenceService.update(id, evidenceId, values), onSuccess: invalidate }),
    remove: useMutation({ mutationFn: (evidenceId: string) => incidentEvidenceService.remove(id, evidenceId), onSuccess: invalidate }),
    archive: useMutation({ mutationFn: ({ evidenceId, values }: any) => incidentEvidenceService.archive(id, evidenceId, values), onSuccess: invalidate }),
    version: useMutation({ mutationFn: ({ evidenceId, values }: any) => incidentEvidenceService.version(id, evidenceId, values), onSuccess: invalidate }),
    mapping: useMutation({ mutationFn: ({ evidenceId, values }: any) => incidentEvidenceService.mapping(id, evidenceId, values), onSuccess: invalidate }),
    custody: useMutation({ mutationFn: ({ evidenceId, values }: any) => incidentEvidenceService.custody(id, evidenceId, values), onSuccess: invalidate }),
    preview: useMutation({ mutationFn: (evidenceId: string) => incidentEvidenceService.preview(id, evidenceId) }),
    download: useMutation({ mutationFn: (evidenceId: string) => incidentEvidenceService.download(id, evidenceId) }),
    requestReview: useMutation({ mutationFn: (values: any) => incidentEvidenceService.requestReview(id, values), onSuccess: invalidate }),
    approveReview: useMutation({ mutationFn: (values: any) => incidentEvidenceService.approveReview(id, values), onSuccess: invalidate }),
    rejectReview: useMutation({ mutationFn: (values: any) => incidentEvidenceService.rejectReview(id, values), onSuccess: invalidate }),
    exportIndex: useMutation({ mutationFn: () => incidentEvidenceService.exportIndex(id) })
  };
}
