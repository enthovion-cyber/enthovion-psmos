import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { incidentAssetsService } from '../services/incident-assets.service';

export function useIncidentAssets(id: string) {
  return useQuery({
    queryKey: ['incidents', 'asset-chemical', id],
    queryFn: () => incidentAssetsService.tab(id),
    enabled: !!id,
    refetchOnWindowFocus: false
  });
}

export function useIncidentAssetMutations(id: string) {
  const queryClient = useQueryClient();
  const invalidate = () => Promise.all([
    queryClient.invalidateQueries({ queryKey: ['incidents', 'asset-chemical', id] }),
    queryClient.invalidateQueries({ queryKey: ['incidents', 'detail', id] }),
    queryClient.invalidateQueries({ queryKey: ['incidents', 'overview', id] }),
    queryClient.invalidateQueries({ queryKey: ['incidents', 'dashboard'] })
  ]);
  return {
    createEquipment: useMutation({ mutationFn: (values: any) => incidentAssetsService.createEquipment(id, values), onSuccess: invalidate }),
    updateEquipment: useMutation({ mutationFn: ({ rowId, values }: any) => incidentAssetsService.updateEquipment(id, rowId, values), onSuccess: invalidate }),
    deleteEquipment: useMutation({ mutationFn: (rowId: string) => incidentAssetsService.deleteEquipment(id, rowId), onSuccess: invalidate }),
    createChemical: useMutation({ mutationFn: (values: any) => incidentAssetsService.createChemical(id, values), onSuccess: invalidate }),
    updateChemical: useMutation({ mutationFn: ({ rowId, values }: any) => incidentAssetsService.updateChemical(id, rowId, values), onSuccess: invalidate }),
    deleteChemical: useMutation({ mutationFn: (rowId: string) => incidentAssetsService.deleteChemical(id, rowId), onSuccess: invalidate }),
    requestReview: useMutation({ mutationFn: (values: any) => incidentAssetsService.requestReview(id, values), onSuccess: invalidate }),
    approveReview: useMutation({ mutationFn: (values: any) => incidentAssetsService.approveReview(id, values), onSuccess: invalidate }),
    rejectReview: useMutation({ mutationFn: (values: any) => incidentAssetsService.rejectReview(id, values), onSuccess: invalidate })
  };
}
