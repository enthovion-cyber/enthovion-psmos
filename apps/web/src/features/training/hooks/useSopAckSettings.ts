import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { sopAckService } from '../services/sop-acknowledgement.service';

export function useSopAckSettings(filters: Record<string, unknown> = {}) {
  return useQuery({ queryKey: ['training', 'sop-ack', 'settings', filters], queryFn: () => sopAckService.settings(filters) });
}

export function useSopAckSettingsMutation() {
  const client = useQueryClient();
  return useMutation({ mutationFn: sopAckService.updateSettings, onSuccess: () => client.invalidateQueries({ queryKey: ['training', 'sop-ack'] }) });
}
