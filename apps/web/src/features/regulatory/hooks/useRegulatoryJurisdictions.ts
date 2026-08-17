import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { regulatoryJurisdictionService } from '../services/regulatory-jurisdiction.service';

export function useRegulatoryJurisdictions(filters?: Record<string, unknown>) {
  return useQuery({ queryKey: ['regulatory', 'jurisdictions', filters], queryFn: () => regulatoryJurisdictionService.list(filters) });
}

export function useRegulatoryJurisdictionMutations() {
  const queryClient = useQueryClient();
  return {
    create: useMutation({ mutationFn: regulatoryJurisdictionService.create, onSuccess: () => queryClient.invalidateQueries({ queryKey: ['regulatory'] }) }),
    link: useMutation({ mutationFn: ({ itemId, data }: { itemId: string; data: Record<string, unknown> }) => regulatoryJurisdictionService.link(itemId, data), onSuccess: () => queryClient.invalidateQueries({ queryKey: ['regulatory'] }) })
  };
}
