import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { incidentCapaService } from '../services/incident-capa.service';
import type { IncidentCapaData } from '../types/incident-capa.types';

export function useIncidentCapa(id: string) {
  return useQuery<IncidentCapaData>({ queryKey: ['incidents', 'capa', id], queryFn: () => incidentCapaService.tab(id), enabled: !!id, refetchOnWindowFocus: false });
}

export function useIncidentCapaMutations(id: string) {
  const queryClient = useQueryClient();
  const invalidate = () => Promise.all([
    queryClient.invalidateQueries({ queryKey: ['incidents', 'capa', id] }),
    queryClient.invalidateQueries({ queryKey: ['incidents', 'detail', id] }),
    queryClient.invalidateQueries({ queryKey: ['incidents', 'overview', id] }),
    queryClient.invalidateQueries({ queryKey: ['incidents', 'dashboard'] })
  ]);
  return {
    create: useMutation({ mutationFn: (values: any) => incidentCapaService.create(id, values), onSuccess: invalidate }),
    update: useMutation({ mutationFn: ({ capaId, values }: any) => incidentCapaService.update(id, capaId, values), onSuccess: invalidate }),
    delete: useMutation({ mutationFn: ({ capaId, values }: any) => incidentCapaService.delete(id, capaId, values), onSuccess: invalidate }),
    generateFromRca: useMutation({ mutationFn: (values: any) => incidentCapaService.generateFromRca(id, values), onSuccess: invalidate }),
    generateFromBarriers: useMutation({ mutationFn: (values: any) => incidentCapaService.generateFromBarriers(id, values), onSuccess: invalidate }),
    linkSource: useMutation({ mutationFn: ({ capaId, values }: any) => incidentCapaService.linkSource(id, capaId, values), onSuccess: invalidate }),
    linkEvidence: useMutation({ mutationFn: ({ capaId, values }: any) => incidentCapaService.linkEvidence(id, capaId, values), onSuccess: invalidate }),
    submitCompletion: useMutation({ mutationFn: ({ capaId, values }: any) => incidentCapaService.submitCompletion(id, capaId, values), onSuccess: invalidate }),
    acceptEvidence: useMutation({ mutationFn: ({ capaId, values }: any) => incidentCapaService.acceptEvidence(id, capaId, values), onSuccess: invalidate }),
    rejectEvidence: useMutation({ mutationFn: ({ capaId, values }: any) => incidentCapaService.rejectEvidence(id, capaId, values), onSuccess: invalidate }),
    verifyEffectiveness: useMutation({ mutationFn: ({ capaId, values }: any) => incidentCapaService.verifyEffectiveness(id, capaId, values), onSuccess: invalidate }),
    requestRework: useMutation({ mutationFn: ({ capaId, values }: any) => incidentCapaService.requestRework(id, capaId, values), onSuccess: invalidate }),
    escalate: useMutation({ mutationFn: ({ capaId, values }: any) => incidentCapaService.escalate(id, capaId, values), onSuccess: invalidate }),
    linkExistingAction: useMutation({ mutationFn: ({ capaId, values }: any) => incidentCapaService.linkExistingAction(id, capaId, values), onSuccess: invalidate }),
    requestReview: useMutation({ mutationFn: (values: any) => incidentCapaService.requestReview(id, values), onSuccess: invalidate }),
    approveReview: useMutation({ mutationFn: (values: any) => incidentCapaService.approveReview(id, values), onSuccess: invalidate }),
    rejectReview: useMutation({ mutationFn: (values: any) => incidentCapaService.rejectReview(id, values), onSuccess: invalidate }),
    export: useMutation({ mutationFn: () => incidentCapaService.export(id), onSuccess: invalidate })
  };
}
