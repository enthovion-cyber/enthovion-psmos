import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { incidentLinkedRecordsService } from '../services/incident-linked-records.service';
import type { IncidentLinkedRecordsData } from '../types/incident-linked-record.types';

export function useIncidentLinkedRecords(id: string) {
  return useQuery<IncidentLinkedRecordsData>({ queryKey: ['incidents', 'linked-records', id], queryFn: () => incidentLinkedRecordsService.tab(id), enabled: !!id, refetchOnWindowFocus: false });
}

export function useIncidentLinkedRecordsMutations(id: string) {
  const queryClient = useQueryClient();
  const invalidate = () => Promise.all([
    queryClient.invalidateQueries({ queryKey: ['incidents', 'linked-records', id] }),
    queryClient.invalidateQueries({ queryKey: ['incidents', 'detail', id] }),
    queryClient.invalidateQueries({ queryKey: ['incidents', 'overview', id] }),
    queryClient.invalidateQueries({ queryKey: ['incidents', 'dashboard'] })
  ]);
  return {
    create: useMutation({ mutationFn: (values: any) => incidentLinkedRecordsService.create(id, values), onSuccess: invalidate }),
    update: useMutation({ mutationFn: ({ linkId, values }: any) => incidentLinkedRecordsService.update(id, linkId, values), onSuccess: invalidate }),
    delete: useMutation({ mutationFn: ({ linkId, values }: any) => incidentLinkedRecordsService.delete(id, linkId, values), onSuccess: invalidate }),
    autoDetect: useMutation({ mutationFn: (values: any) => incidentLinkedRecordsService.autoDetect(id, values), onSuccess: invalidate }),
    refresh: useMutation({ mutationFn: (linkId: string) => incidentLinkedRecordsService.refresh(id, linkId), onSuccess: invalidate }),
    refreshAll: useMutation({ mutationFn: () => incidentLinkedRecordsService.refreshAll(id), onSuccess: invalidate }),
    updateImpact: useMutation({ mutationFn: ({ impactId, values }: any) => incidentLinkedRecordsService.updateImpact(id, impactId, values), onSuccess: invalidate }),
    createFollowup: useMutation({ mutationFn: (values: any) => incidentLinkedRecordsService.createFollowup(id, values), onSuccess: invalidate }),
    requestReview: useMutation({ mutationFn: (values: any) => incidentLinkedRecordsService.requestReview(id, values), onSuccess: invalidate }),
    approveReview: useMutation({ mutationFn: (values: any) => incidentLinkedRecordsService.approveReview(id, values), onSuccess: invalidate }),
    rejectReview: useMutation({ mutationFn: (values: any) => incidentLinkedRecordsService.rejectReview(id, values), onSuccess: invalidate }),
    export: useMutation({ mutationFn: () => incidentLinkedRecordsService.export(id), onSuccess: invalidate })
  };
}
