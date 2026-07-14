import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { incidentDetailService } from '../services/incident-detail.service';

export function useIncidentDetail(id: string) {
  return useQuery({
    queryKey: ['incidents', 'detail', id],
    queryFn: () => incidentDetailService.detail(id),
    enabled: !!id,
    refetchInterval: 30000,
    refetchOnWindowFocus: false
  });
}

export function useIncidentOverview(id: string) {
  return useQuery({
    queryKey: ['incidents', 'overview', id],
    queryFn: () => incidentDetailService.overview(id),
    enabled: !!id,
    refetchInterval: 30000,
    refetchOnWindowFocus: false
  });
}

export function useIncidentDetailMutations(id: string) {
  const queryClient = useQueryClient();
  const invalidate = () => Promise.all([
    queryClient.invalidateQueries({ queryKey: ['incidents', 'detail', id] }),
    queryClient.invalidateQueries({ queryKey: ['incidents', 'overview', id] }),
    queryClient.invalidateQueries({ queryKey: ['incidents', 'dashboard'] })
  ]);
  return {
    assignOwner: useMutation({ mutationFn: (values: any) => incidentDetailService.assignOwner(id, values), onSuccess: invalidate }),
    changeStatus: useMutation({ mutationFn: (values: any) => incidentDetailService.changeStatus(id, values), onSuccess: invalidate }),
    close: useMutation({ mutationFn: (values: any) => incidentDetailService.close(id, values), onSuccess: invalidate }),
    reopen: useMutation({ mutationFn: (values: any) => incidentDetailService.reopen(id, values), onSuccess: invalidate }),
    exportSummary: useMutation({ mutationFn: () => incidentDetailService.exportSummary(id) })
  };
}
