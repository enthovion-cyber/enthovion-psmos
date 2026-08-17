import { useQuery } from '@tanstack/react-query';
import { regulatoryActionService } from '../services/regulatory-action.service';

export function useRegulatoryActionSyncLog(actionLinkId: string) {
  return useQuery({ queryKey: ['regulatory', 'actions', 'sync-log', actionLinkId], queryFn: () => regulatoryActionService.section(actionLinkId, 'sync-log'), enabled: Boolean(actionLinkId), refetchOnWindowFocus: false });
}
